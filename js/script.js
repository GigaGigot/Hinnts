// constantes
let MAIN_COOKIE = "saveHinnts";
let CANVAS_WIDTH = 1200;
let CANVAS_HEIGHT = 800;
let FONT = "Papyrus";
let KEY_SKILL_1, KEY_SKILL_2, KEY_SKILL_3, KEY_SKILL_4;
let LOADING_STATE = "LOADING_STATE", PLAY_STATE = "PLAY_STATE", LOST_STATE = "LOST_STATE", MENU_STATE = "MENU_STATE", OPTIONS_STATE = "OPTIONS_STATE", LORE_STATE = "LORE_STATE", HOWTOPLAY_STATE = "HOWTOPLAY_STATE";
let DMG_RULE_FIXE = "FIXE", DMG_RULE_DIVIDE = "DIVIDE", DMG_RULE_SQUARE = "SQUARE";
let SCORE_RULE_NONE = "NONE", SCORE_RULE_HP_LOSS = "HP_LOSS", SCORE_RULE_SQUARE = "SQUARE";

// Common content
let images = {};
let images3States = {};
let titre, pluie1, pluie2, eclair1, eclair2, nuage1, brume1, nuage2, brume2;
let audios = [];
let scrolledUp, scrolledDown;
let currentScore;
let previousState, currentState;

async function startGame() {
    // Preload mandatory stuff
    images.default_cursor = await NewImage("./img/default_cursor.png");
    images.focus_cursor = await NewImage("./img/focus_cursor.png");
    images.mainBg = await NewImage("./img/mainBg.png");

    // Cookies
    if (!checkCookie(MAIN_COOKIE)) {
        // Initialize default keyboard        
        if (navigator != null && navigator.language.match(/fr/)) {
            Data.keyboard = "AZERTY";
        }
        else {
            Data.keyboard = "QWERTY";
        }
    }
    saveCookie();

    // Set up the game
    Cursor.load();
    Game.setSkillsKeys();
    Game.start();

    // Loading screen
    changeState(LOADING_STATE);
};

let Data = {
    highestScore: null,
    volume: 0.5,
    keyboard: "AZERTY"
}

let LastGameSummary = {
    killCount: 0,
    highestDamageDealt: 0,
    highestEnnemyHpDefeated: 0,
    youCouldHaveList : [],
    reset: function () {
        this.killCount = 0;
        this.highestDamageDealt = 0;
        this.highestEnnemyHpDefeated = 0;
        this.youCouldHaveList = [];
    }
}

function YouCouldHaveStat(life, rule, divideValue) {
    this.life = life;
    this.rule = rule;
    this.divideValue = divideValue;
    this.done = false;
    this.toClearString = function () {
        if (this.rule == DMG_RULE_SQUARE) {
            return `- Done the square root of ${this.life}`;
        }
        else if (this.rule == DMG_RULE_DIVIDE) {
            return `- Divided ${this.life} by ${this.divideValue}`;
        }
        else {
            return ""
        }
    }
}

let Game = {
    canvas: document.createElement("canvas"),
    start: function () {
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.canvas.style.cursor = "none";
        this.context = this.canvas.getContext("2d");
        document.getElementById("main").appendChild(this.canvas);
        this.frameNo = 0;

        // init
        window.addEventListener('click', function(e) {
            this.music = new Sound("./sound/soundtrackv5.wav", true);
            this.music.play();
        }, {once: true});

        // touches
        window.addEventListener('keydown', function (e) {
            Game.keysDown = (Game.keysDown || []);
            Game.keysDown[e.keyCode] = true;
        })
        window.addEventListener('keyup', function (e) {
            if (Game.keysDown) {
                Game.keysDown[e.keyCode] = false;
            }
            Game.keys = (Game.keys || []);
            Game.keys[e.keyCode] = true;
        })

        // mvts souris
        window.addEventListener('mousemove', function (e) {
            Game.xMouseMove = e.pageX - $("canvas").offset().left;
            Game.yMouseMove = e.pageY - $("canvas").offset().top;
			Game.xMouseUp = false;
            Game.yMouseUp = false;
			if (Game.xMouseDown != false && Game.yMouseDown != false && Game.xMouseDown != undefined && Game.yMouseDown != undefined) {
				Game.xMouseDown = e.pageX - $("canvas").offset().left;
				Game.yMouseDown = e.pageY - $("canvas").offset().top;
			}
        })
        window.addEventListener('mousedown', function (e) {
            Game.xMouseDown = e.pageX - $("canvas").offset().left;
            Game.yMouseDown = e.pageY - $("canvas").offset().top;
			Game.xMouseUp = false;
            Game.yMouseUp = false;
        })
        window.addEventListener('mouseup', function (e) {
			Game.xMouseUp = e.pageX - $("canvas").offset().left;
			Game.yMouseUp = e.pageY - $("canvas").offset().top;
			Game.xMouseDown = false;
			Game.yMouseDown = false;
        })

        // scroll (Firefox)
        window.addEventListener("DOMMouseScroll", function (e) {
            if (!e) e = window.event;
            if (e.detail < 0 || e.wheelDelta > 0) {
                scrolledUp = true;
            }
            else {
                scrolledDown = true;
            }
        }, false);

        // scroll (everyone else)
        window.addEventListener("mousewheel", function (e) {
            if (!e) e = window.event;
            if (e.detail < 0 || e.wheelDelta > 0) {
                scrolledUp = true;
            }
            else {
                scrolledDown = true;
            }
        }, false);
    },
	update: function () {
		this.clear();
        this.frameNo += 1;
		Cursor.changeCursor("default");
	},
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop: function () {
        clearInterval(this.interval);
    },
    setSkillsKeys: function () {
        switch (Data.keyboard) {
            case "AZERTY":
                KEY_SKILL_1 = 65;
                KEY_SKILL_2 = 90;
                KEY_SKILL_3 = 69; //Nice
                KEY_SKILL_4 = 82;
                break;
            case "QWERTY":
                KEY_SKILL_1 = 81;
                KEY_SKILL_2 = 87;
                KEY_SKILL_3 = 69; //Nice
                KEY_SKILL_4 = 82;
                break;
        }
    },
	setSoundVolume: function() {
        audios.forEach(audio => audio.sound.volume = 0.5 * Data.volume);
	},
    clearMouseUp: function() {
        Game.xMouseUp = null;
		Game.yMouseUp = null;
    }
};

let Cursor = {
	currentC: null,
    curseur: null,
    curseurTypes: null,
    load: function () {
        this.currentC = "default";
        this.curseur = new ImageSameDim(0, 0, images.default_cursor);
        this.curseurTypes = [
            { code: "default", image: images.default_cursor },
            { code: "focus", image: images.focus_cursor }
        ]
    },
	changeCursor: function(type) {
		if (type != this.currentC) {
			this.currentC = type;
			this.curseur.image = this.curseurTypes.find(el => el.code == type).image;
		}
	},
	update: function() {
		this.curseur.x = Game.xMouseMove;
		this.curseur.y = Game.yMouseMove;
		this.curseur.update();
	}
};

function Skills() {
    this.skills1 = [
        { code: "moinsUn", image: images.moinsUn, dmg: 1, dmgRule: DMG_RULE_FIXE, score: 1, scoreRule: SCORE_RULE_NONE }
    ],
    this.skillsPos1 = 0,
    this.skills2 = [
        { code: "diviseParDeux", image: images.diviseParDeux, dmg: 2, dmgRule: DMG_RULE_DIVIDE, score: 2, scoreRule: SCORE_RULE_HP_LOSS },
        { code: "diviseParTrois", image: images.diviseParTrois, dmg: 3, dmgRule: DMG_RULE_DIVIDE, score: 3, scoreRule: SCORE_RULE_HP_LOSS },
        { code: "diviseParCinq", image: images.diviseParCinq, dmg: 5, dmgRule: DMG_RULE_DIVIDE, score: 5, scoreRule: SCORE_RULE_HP_LOSS },
        { code: "diviseParSept", image: images.diviseParSept, dmg: 7, dmgRule: DMG_RULE_DIVIDE, score: 7, scoreRule: SCORE_RULE_HP_LOSS },
        { code: "diviseParOnze", image: images.diviseParOnze, dmg: 11, dmgRule: DMG_RULE_DIVIDE, score: 11, scoreRule: SCORE_RULE_HP_LOSS }
    ],
    this.skillsPos2 = 0,
    this.skills3 = [
        { code: "diviseParDix", image: images.diviseParDix, dmg: 10, dmgRule: DMG_RULE_DIVIDE, score: 10, scoreRule: SCORE_RULE_HP_LOSS },
        { code: "diviseParCent", image: images.diviseParCent, dmg: 100, dmgRule: DMG_RULE_DIVIDE, score: 20, scoreRule: SCORE_RULE_HP_LOSS },
        { code: "diviseParMille", image: images.diviseParMille, dmg: 1000, dmgRule: DMG_RULE_DIVIDE, score: 30, scoreRule: SCORE_RULE_HP_LOSS }
    ],
    this.skillsPos3 = 0,
    this.skills4 =  [
        { code: "racineCarree", image: images.racineCarree, dmg: 0, dmgRule: DMG_RULE_SQUARE, score: 0, scoreRule: SCORE_RULE_SQUARE }
    ],
    this.skillsPos4 = 0,
    this.update = function () {
        if (scrolledUp) {
            scrolledUp = false;
            this.setModeSkill("up");
        }
        else if (scrolledDown) {
            scrolledDown = false;
            this.setModeSkill("down");
        }
    },
    this.setModeSkill = function (direction) {
        let i = 0;
        if (direction == "up") {
            i = 1;
        } else if (direction == "down") {
            i = -1;
        }
        if (Game.keysDown && Game.keysDown[KEY_SKILL_1]) {
            if (this.skills1[this.skillsPos1 + i] !== undefined) {
                this.skillsPos1 += i;
            }
        }
        if (Game.keysDown && Game.keysDown[KEY_SKILL_2]) {
            if (this.skills2[this.skillsPos2 + i] !== undefined) {
                this.skillsPos2 += i;
            }
        }
        if (Game.keysDown && Game.keysDown[KEY_SKILL_3]) {
            if (this.skills3[this.skillsPos3 + i] !== undefined) {
                this.skillsPos3 += i;
            }
        }
        if (Game.keysDown && Game.keysDown[KEY_SKILL_4]) {
            if (this.skills4[this.skillsPos4 + i] !== undefined) {
                this.skillsPos4 += i;
            }
        }
    },
    this.getCastedSkill = function () {
        let skill;
        if (Game.keys && Game.keys[KEY_SKILL_1]) {
            skill = this.skills1[this.skillsPos1];
            Game.keys[KEY_SKILL_1] = false;
        } else if (Game.keys && Game.keys[KEY_SKILL_2]) {
            skill = this.skills2[this.skillsPos2];
            Game.keys[KEY_SKILL_2] = false;
        } else if (Game.keys && Game.keys[KEY_SKILL_3]) {
            skill = this.skills3[this.skillsPos3];
            Game.keys[KEY_SKILL_3] = false;
        } else if (Game.keys && Game.keys[KEY_SKILL_4]) {
            skill = this.skills4[this.skillsPos4];
            Game.keys[KEY_SKILL_4] = false;
        }
        return skill;
    }
};

function Defender(width, height, sprite) {
    this.width = width;
    this.height = height;
    this.x = Game.canvas.width / 2 - width / 2;
    this.y = Game.canvas.height / 2 - height / 2;
    this.hitboxInnerMargin = 5; // Arbitrary value
    this.xCenter = this.x + (this.width / 2);
    this.yCenter = this.y + (this.height / 2);
    this.life = new LifeBar(Game.canvas.width / 2 - 97, Game.canvas.height - 110);
    this.sprite = new Sprite(this.x, this.y, width, height, sprite, 0);
    this.ombre = new Sprite(this.x - 18, this.y - 18, 100, 100, images.tour_ombre, 0);
    this.joueur = new Sprite(this.x - 18, this.y - 18, 100, 100, images.joueur, 0);
    this.tooClose = new ImageSameDim(this.x - 18, this.y - 18, images.tooClose);
    this.cptTooClose = 0;
    this.update = function () {
        // Regen
        if (everyInterval(20) && this.life.currHP < this.life.maxHP) {
            this.life.regeneratingHP++;
            if (this.life.regeneratingHP >= 100) {
                this.life.regeneratingHP = 0;
                this.life.currHP++;
            }
        }

        // Make the shadow spin indefinitely
        this.ombre.angle++;
        if (this.ombre.angle >= 360) {
            this.ombre.angle = 0;
        }

        // Player orientation
        let dx = (Game.xMouseMove - this.xCenter);
        let dy = (Game.yMouseMove - this.yCenter);
        let mag = Math.sqrt(dx * dx + dy * dy);
        this.joueur.angle = Math.atan2(Game.yMouseMove - this.yCenter, Game.xMouseMove - this.xCenter) / Math.PI * 180;

        // Updates
        this.ombre.update();
        this.sprite.update();

        if (IsTooClose(this.xCenter, this.yCenter, Game.xMouseMove, Game.yMouseMove)) {
            this.cptTooClose++;
            if (this.cptTooClose > 5) {
                this.tooClose.update();
            }
        }
        else {
            this.cptTooClose = 0;
        }

        this.joueur.update();
    }
    this.decreaseLife = function (dmg) {
        this.life.currHP -= dmg;
        this.life.regeneratingHP = 0;
        if (this.life.currHP < 0) {
            this.life.currHP = 0;
        }
    }
};

function Attacker(width, height, image, image_reversed, x, y, xSpeed, ySpeed, flip, life) {
    this.width = width;
    this.height = height;
    this.x = x - width / 2;
    this.y = y - height / 2;
    this.xCenter = x + (width / 2);
    this.yCenter = y + (height / 2);
    this.speed = 0.1 * rand(2,5);
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
    this.hitboxInnerMargin = 7; // Arbitrary value
    this.dead = false;
    this.ERROR_IN_LIFE = false;
    this.maxLife = life;
    this.life = life;
    this.lifeDsp = new Texte("16px", FONT, "white", x + TextWidth(String(this.life)), y - 2, String(this.life));
    this.sprite = new SpriteAnimated(x, y, width, height, image, image_reversed, flip, 8);
    this.update = function () {
		if (this.dead == false) {
			this.lifeDsp.newPos(this.x + (this.width / 2) - (TextWidth(String(this.life)) / 2), this.y - 2);
			this.lifeDsp.update();
		}
        this.sprite.update();
    }
    this.newPos = function () {
        if (this.dead == true) {
            this.speed = Math.max(this.speed - 0.02, 0);
        }
        this.x += this.xSpeed * this.speed;
        this.y += this.ySpeed * this.speed;
        this.sprite.x = this.x;
        this.sprite.y = this.y;
    }
    this.crashWith = function (otherobj) {
        let myleft = this.x;
        let myright = this.x + (this.width);
        let mytop = this.y;
        let mybottom = this.y + (this.height);
        let hitboxInnerMarginOtherObj = (otherobj.hitboxInnerMargin != undefined ? otherobj.hitboxInnerMargin : 0);
        let otherleft = otherobj.x + hitboxInnerMarginOtherObj;
        let otherright = otherobj.x + (otherobj.width) - hitboxInnerMarginOtherObj;
        let othertop = otherobj.y + hitboxInnerMarginOtherObj;
        let otherbottom = otherobj.y + (otherobj.height) - hitboxInnerMarginOtherObj;
        let crash = true;
        if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
    this.decreaseLife = function (skill) {
        let oldLife = this.life;
        let newLife = this.life;

        // Do damages
        if (skill.dmgRule == DMG_RULE_FIXE) {
            newLife -= skill.dmg;
        }
        else if (skill.dmgRule == DMG_RULE_DIVIDE) {
            newLife /= skill.dmg;
        }
        else if (skill.dmgRule == DMG_RULE_SQUARE) {
            newLife = Math.sqrt(oldLife);
        }

        if (newLife % 1 !== 0) {
            this.ERROR_IN_LIFE = true;
            this.dieded();
        }
        else {
            // stat
            if (this.maxLife == oldLife) {
                let youCouldHave = LastGameSummary.youCouldHaveList.find(e => e.life == this.maxLife);
                if (youCouldHave != null) {
                    if (youCouldHave.rule == skill.dmgRule && (youCouldHave.divideValue == null || youCouldHave.divideValue == skill.dmg)) {
                        youCouldHave.done = true;
                    }
                }
            }

            // Do score
            if (skill.scoreRule == SCORE_RULE_NONE) {
                currentScore += skill.score;
            }
            else if (skill.scoreRule == SCORE_RULE_HP_LOSS) {
                currentScore += Math.round(Math.log2(oldLife - newLife) * skill.score);
            }
            else if (skill.scoreRule == SCORE_RULE_SQUARE) {
                currentScore += Math.round(Math.log2(oldLife - newLife) * newLife);
            }

            let damageDealt = oldLife - newLife;
            if (LastGameSummary.highestDamageDealt == undefined || LastGameSummary.highestDamageDealt < damageDealt) {
                LastGameSummary.highestDamageDealt = damageDealt;
            }

            this.life = newLife;
            this.lifeDsp.text = this.life;

            if (newLife <= 0) {
                this.dieded();
                LastGameSummary.killCount++;

                if (LastGameSummary.highestEnnemyHpDefeated == undefined || LastGameSummary.highestEnnemyHpDefeated < this.maxLife) {
                    LastGameSummary.highestEnnemyHpDefeated = this.maxLife;
                }
            }
        }
    }
	this.dieded = function () {
        this.dead = true;
        this.sprite.frameNo = 0;
		this.sprite.deathAnimation = true;
	}
};

function Shoot(x, y, width, height, xSpeed, ySpeed, skill, angle) {
    this.x = x - width / 2;
    this.y = y - height / 2;
    this.width = width;
    this.height = height;
    this.speed = 10;
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
    this.skill = skill;
    this.sprite = new Sprite(this.x, this.y, width, height, images.shoot, angle);
    this.update = function () {
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.update();
    }
    this.newPos = function () {
        this.x += this.xSpeed * this.speed;
        this.y += this.ySpeed * this.speed;
    }
    this.crashWith = function (otherobj) {
        let myleft = this.x;
        let myright = this.x + (this.width);
        let mytop = this.y;
        let mybottom = this.y + (this.height);
        let hitboxInnerMarginOtherObj = (otherobj.hitboxInnerMargin != undefined ? otherobj.hitboxInnerMargin : 0);
        let otherleft = otherobj.x + hitboxInnerMarginOtherObj;
        let otherright = otherobj.x + (otherobj.width) - hitboxInnerMarginOtherObj;
        let othertop = otherobj.y + hitboxInnerMarginOtherObj;
        let otherbottom = otherobj.y + (otherobj.height) - hitboxInnerMarginOtherObj;
        let crash = true;
        if ((mybottom < othertop) ||
            (mytop > otherbottom) ||
            (myright < otherleft) ||
            (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
};

function InterfaceSkills(skills) {
    let x1 = 460, x2 = 532, x3 = 604, x4 = 676;
    let y1 = Game.canvas.height - 41;
    this.skills = skills;
    this.bg = new ImageSameDim(Game.canvas.width / 2 - images.interfaceSkills.width / 2, Game.canvas.height - images.interfaceSkills.height, images.interfaceSkills);
    this.bgSkill1 = new ImageSameDim(x1, y1, images.sort);
    this.bgSkill2 = new ImageSameDim(x2, y1, images.sort);
    this.bgSkill3 = new ImageSameDim(x3, y1, images.sort);
    this.bgSkill4 = new ImageSameDim(x4, y1, images.sort);
    this.bgSkillDown1 = new ImageSameDim(x1, y1, images.sortAppuye);
    this.bgSkillDown2 = new ImageSameDim(x2, y1, images.sortAppuye);
    this.bgSkillDown3 = new ImageSameDim(x3, y1, images.sortAppuye);
    this.bgSkillDown4 = new ImageSameDim(x4, y1, images.sortAppuye);
    this.skill1 = new ImageSameDim(x1, y1, this.skills.skills1[this.skills.skillsPos1].image);
    this.skill2 = new ImageSameDim(x2, y1, this.skills.skills2[this.skills.skillsPos2].image);
    this.skill3 = new ImageSameDim(x3, y1, this.skills.skills3[this.skills.skillsPos3].image);
    this.skill4 = new ImageSameDim(x4, y1, this.skills.skills4[this.skills.skillsPos4].image);
    this.update = function () {
        this.bg.update();
        this.bgSkill1.update();
        this.bgSkill2.update();
        this.bgSkill3.update();
        this.bgSkill4.update();
        if (Game.keysDown && Game.keysDown[KEY_SKILL_1]) {
            this.bgSkillDown1.update();
        }
        if (Game.keysDown && Game.keysDown[KEY_SKILL_2]) {
            this.bgSkillDown2.update();
        }
        if (Game.keysDown && Game.keysDown[KEY_SKILL_3]) {
            this.bgSkillDown3.update();
        }
        if (Game.keysDown && Game.keysDown[KEY_SKILL_4]) {
            this.bgSkillDown4.update();
        }
        this.skill1.image = this.skills.skills1[this.skills.skillsPos1].image;
        this.skill1.update();
        this.skill2.image = this.skills.skills2[this.skills.skillsPos2].image;
        this.skill2.update();
        this.skill3.image = this.skills.skills3[this.skills.skillsPos3].image;
        this.skill3.update();
        this.skill4.image = this.skills.skills4[this.skills.skillsPos4].image;
        this.skill4.update();
    }
};

function Sprite(x, y, width, height, image, angle) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = new Image();
    this.image = image;
    this.angle = angle;
    this.update = function () {
        ctx = Game.context;
        if (this.angle == 0) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.drawImage(this.image, -(this.width / 2), -(this.height / 2));
            ctx.restore();
        }
    }
};

function SpriteAnimated(x, y, width, height, image, image_reversed, flip, vitesse) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = new Image();
    this.image = image;
    this.image_reversed = new Image();
    this.image_reversed = image_reversed;
    this.nbFrames = this.image.width / this.width;
    this.frameNo = 0;
    this.randomFrameNo = 0;
    this.flip = flip;
	this.vitesse = vitesse;
    this.deathAnimation = false;
    this.deathAnimationOpacity = 1;
    this.freezeAnimation = false;
    this.freezeAnimationFrameCpt = 0;
	this.end = false;
    this.update = function () {
        Game.context.save();
        if (this.flip) {
        }

        if (this.deathAnimation) {            
            if (this.freezeAnimationFrameCpt > 25) { // Arbitrary value
                this.deathAnimationOpacity = Math.max(this.deathAnimationOpacity - 0.04, 0);
            }
            Game.context.globalAlpha = this.deathAnimationOpacity;
            Game.context.drawImage((this.flip ? this.image_reversed : this.image), this.width * this.frameNo, this.height * 2, this.width, this.height, this.x, this.y, this.width, this.height);
        } else {
            // First line : corpse
            Game.context.drawImage((this.flip ? this.image_reversed : this.image), this.width * this.randomFrameNo, 0, this.width, this.height, this.x, this.y, this.width, this.height);
            // Second line : eyes
            Game.context.drawImage((this.flip ? this.image_reversed : this.image), this.width * this.frameNo, this.height, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        Game.context.restore();

        if (!this.freezeAnimation) {
            if (this.deathAnimation) {
                // Faster death animation
                if (everyInterval(5)) {
                    this.frameNo++;
                }
            }
            else {
                if (everyInterval(this.vitesse)) {
                    this.frameNo++;
                }
            }
            if (this.frameNo == this.nbFrames && this.deathAnimation == false) {
                this.frameNo = 0;
            }

            if (everyInterval(60)) {
                let tmpRandomFrame = 0;
                do {
                    tmpRandomFrame = rand(0, this.nbFrames - 1);
                } while (tmpRandomFrame == this.randomFrameNo);
                this.randomFrameNo = tmpRandomFrame;
            }
        }

        if (this.deathAnimation) {
            if (this.frameNo == this.nbFrames - 1) {
                this.freezeAnimation = true;
            }
        }

        if (this.freezeAnimation == true) {
            this.freezeAnimationFrameCpt++;
            if (this.freezeAnimationFrameCpt > 50) { // Arbitrary value
                this.end = true;
            }
        }
    }
};

function Button(x, y, image3States, imageTxt) {
    let defaultImg = image3States.normal; // Normal image is used for properties initialisations
    this.x = x;
    this.y = y;
    this.width = defaultImg.width;
    this.height = defaultImg.height;
    this.image3States = image3States;
    this.fond = new ImageSameDim(x, y, defaultImg);
    if (imageTxt != null) {
        // Image must have same width and height than button to work properly
        this.texte = new ImageSameDim(x, y, imageTxt);
    }
	this.focused = false;
	this.clickedDown = false;
	this.clickedUp = false;
    this.update = function () {
		this.checkEvent();
		this.changeEvent();
        this.fond.update();
        if (this.texte !== undefined) {
            this.texte.update();
        }
    }
	this.checkEvent = function () {
		if (Game.xMouseMove >= this.x && Game.xMouseMove <= this.x + this.width && Game.yMouseMove >= this.y && Game.yMouseMove <= this.y + this.height) {
			this.focused = true;
		}
		else {
			this.focused = false;
		}

		if (Game.xMouseDown >= this.x && Game.xMouseDown <= this.x + this.width && Game.yMouseDown >= this.y && Game.yMouseDown <= this.y + this.height) {
			this.clickedDown = true;
		}
		else {
			this.clickedDown = false;
		}

		if (Game.xMouseUp >= this.x && Game.xMouseUp <= this.x + this.width && Game.yMouseUp >= this.y && Game.yMouseUp <= this.y + this.height) {
			this.clickedUp = true;
		}
		else {
			this.clickedUp = false;
		}
	}
	this.changeEvent = function () {
		if (this.focused) {
			Cursor.changeCursor("focus");
			this.fond.image = this.image3States.focused;
		}
		else {
			this.fond.image = this.image3States.normal;
		}
		if (this.clickedDown) {
			this.fond.image = this.image3States.clicked;
		}
	}
    this.isClicked = function() {
        if (this.clickedUp) {
            Game.clearMouseUp()
            return true;
        }
        else {
            return false;
        }
    }
};

function ImageBase(x, y, width, height, texture) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.image = texture;
    this.update = function () {
        ctx = Game.context;
        if (this.speedX != 0 || this.speedY != 0) {
            this.x += this.speedX;
            this.y += this.speedY;

            let x = this.x % this.width;
			let y = this.y % this.height;

            let vx = this.x > 0 ? -1 : 0;
            let vy = this.y > 0 ? -1 : 0;
            for(let row = 0; row < 2; row++) {
                for(let col = 0; col < 2; col++) {
                    ctx.drawImage(this.image, x + this.width * (row + vx), y + this.height * (col + vy));
                }
            }
		}
        else {
            if (this.width != 0) {
                ctx.drawImage(this.image, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
            }
        }
    }
    this.setSpeed = function(sx, sy) {
        this.speedX = sx;
        this.speedY = sy;
    }
};

function ImageSameDim(x, y, texture) {
    ImageBase.call(this, x, y, texture.width, texture.height, texture);
}

function ImageFull(texture) {
    ImageBase.call(this, 0, 0, Game.canvas.width, Game.canvas.height, texture);
}

function Texte(size, font, color, x, y, text) {
    this.size = size;
    this.font = font;
    this.x = x;
    this.y = y;
    this.bold = false;
    this.underline = false;
    this.centered = false;
    if (text != null) {
        this.text = text;
    }
    this.update = function () {
        ctx = Game.context;
        let boldDsp = "";
        if (this.bold == true) {
            boldDsp = "bold ";
        }
        ctx.font = boldDsp + this.size + " " + this.font;
        ctx.fillStyle = color;
        var textMeasurement = ctx.measureText(this.text);

        var xOffset = 0;
        if (this.centered) {
            xOffset = -1 * (textMeasurement.width / 2);
        }
        ctx.fillText(this.text, this.x + xOffset, this.y);

        if (this.underline == true) {
            ctx.fillRect(this.x + xOffset, this.y + textMeasurement.hangingBaseline * 0.5, textMeasurement.width, 2);
        }
    }
    this.newPos = function (x, y) {
        this.x = x;
        this.y = y;
    }
};

function LifeBar(x, y) {
    this.contour1 = new ImageSameDim(x, y, images.heartLifeBorder);
    this.fond1 = new ImageSameDim(x, y, images.heartLifeEmpty);
    this.vie1 = new ImageSameDim(x, y, images.heartLifeFull);

    this.contour2 = new ImageSameDim(x + 64, y, images.heartLifeBorder);
    this.fond2 = new ImageSameDim(x + 64, y, images.heartLifeEmpty);
    this.vie2 = new ImageSameDim(x + 64, y, images.heartLifeFull);
    this.regen2 = new ImageSameDim(x + 64, y, images.heartLifeRegenerating);

    this.contour3 = new ImageSameDim(x + 128, y, images.heartLifeBorder);
    this.fond3 = new ImageSameDim(x + 128, y, images.heartLifeEmpty);
    this.vie3 = new ImageSameDim(x + 128, y, images.heartLifeFull);
    this.regen3 = new ImageSameDim(x + 128, y, images.heartLifeRegenerating);

    this.maxHP = 3;
    this.currHP = this.maxHP;
    this.regeneratingHP = 0;
    this.update = function () {
        this.fond1.update();
        if (this.currHP > 0) {
            this.vie1.update();
        }
        this.contour1.update();

        this.vie2.update();
        if (this.currHP == 1) {
            this.regen2.update();
            this.fond2.height = (this.vie2.height - 22) * (Math.abs((this.regeneratingHP - 100) / 100)) + 11;
            this.fond2.update();
        }
        else if (this.currHP < 1) {
            if (this.fond2.height != this.vie2.height) {
                this.fond2.height = this.vie2.height;
            }
            this.fond2.update();
        }
        this.contour2.update();

        this.vie3.update();
        if (this.currHP == 2) {
            this.regen3.update();
            this.fond3.height = (this.vie3.height - 22) * (Math.abs((this.regeneratingHP - 100) / 100)) + 11;
            this.fond3.update();
        }
        else if (this.currHP < 2) {
            if (this.fond3.height != this.vie3.height) {
                this.fond3.height = this.vie3.height;
            }
            this.fond3.update();
        }
        this.contour3.update();
    }
};

function BarSlider(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.min = 0;
    this.max = 10;
    this.bar = new ImageSameDim(x, y, images.barslide);
    this.bitogno = new ImageSameDim(x + width / 2 - 8, y-4, images.barslide_bitogno);
    this.dspMin = new Texte("14px", FONT, "white", x-20, y + 12, String(this.min));
    this.dspMax = new Texte("14px", FONT, "white", x + width + 10, y + 12, String(this.max));
    this.dspCurrent = new Texte("14px", FONT, "white", x, y - 6, null);
	this.bitognoClicked = false;
    this.update = function () {
		this.onFocus();
		this.getClicked();
		this.move();
        this.bar.update();
        this.bitogno.update();
		this.afficherTexte();
    }
	this.move = function () {
		if (this.bitognoClicked) {
			this.bitogno.x = this.newXPos();
		}
	}
	this.onFocus = function () {
		if (this.focused()) {
			Cursor.changeCursor("focus");
		}
	}
	this.focused = function () {
		if (Game.xMouseMove >= this.bitogno.x
           && Game.xMouseMove <= this.bitogno.x + this.bitogno.width
           && Game.yMouseMove >= this.bitogno.y
           && Game.yMouseMove <= this.bitogno.y + this.bitogno.height) {
			return true;
		}
		else {
			return false;
		}
	}
	this.newXPos = function () {
		let newX = 0;
		if (Game.xMouseMove < this.x) {
			newX = this.x - this.bitogno.width / 2;
		}
		else if (Game.xMouseMove > this.x + this.width) {
			newX = this.x + this.width - this.bitogno.width / 2;
		}
		else {
			newX = Game.xMouseMove - this.bitogno.width / 2;
		}
		return newX;
	}
	this.getClicked = function() {
        if (Game.xMouseDown >= this.bitogno.x
           && Game.xMouseDown <= this.bitogno.x + this.bitogno.width
           && Game.yMouseDown >= this.bitogno.y
           && Game.yMouseDown <= this.bitogno.y + this.bitogno.height) {
            this.bitognoClicked = true;
        }
		if (Game.xMouseDown == false && Game.yMouseDown == false) {
			this.bitognoClicked = false;
		}
	}
	this.afficherTexte = function () {
		this.dspMin.update();
		this.dspMax.update();
		this.dspCurrent.text = Math.round(((this.bitogno.x + this.bitogno.width / 2 - this.x) / this.width) * this.max);
		this.dspCurrent.x = this.bitogno.x + (this.bitogno.width / 2) - (TextWidth(this.dspCurrent.text) / 2);
		this.dspCurrent.update();
	}
    this.setValeur = function(valeur) {
        if (valeur <= this.min) {
            this.bitogno.x = this.x - this.bitogno.width / 2;
		}
		else if (valeur >= this.max) {
			this.bitogno.x = this.x + this.width - this.bitogno.width / 2;
		}
		else {
            let percent = (valeur - this.min) / (this.max - this.min);
			this.bitogno.x = this.x + this.width * percent - this.bitogno.width / 2;
		}
    }
};

function Sound(src, looping) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.loop = looping;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    audios.push(this);
    Game.setSoundVolume();

    this.play = function () {
        this.sound.play();
    }
    this.stop = function () {
        this.sound.pause();
    }
}

/* Fonctions boucle */
function lancerChargement() {
    let bg = new ImageFull(images.mainBg);
    let currentLoadedImagesText = new Texte("24px", FONT, "white", Game.canvas.width / 2, Game.canvas.height / 2, `Loading resources...`);
    let cptResources = 0;
    let currentResourceLoaded = 0;

    Game.interval = setInterval(update, 20);
    loadResources();

    function update() {
        Game.update();

        bg.update();

        if (cptResources > 0) {            
            currentLoadedImagesText.text = `Loading resources : ${String(currentResourceLoaded)}/${String(cptResources)}`;
        }
        currentLoadedImagesText.x = Game.canvas.width / 2 - TextWidth(currentLoadedImagesText.text) / 2
        currentLoadedImagesText.update();

		Cursor.update();
    };

    async function loadResources() {
        let fontSource = new FontFace(FONT, "url(font/PAPYRUS.TTF)");
        cptResources++;

        let sources = {
            titre: "./img/titre.png",
            pluie: "./img/pluie.png",
            eclair: "./img/eclair.png",
            eclairRouge: "./img/eclairRouge.png",
            nuage1: "./img/nuage1.png",
            brume1: "./img/brume1.png",
            nuage2: "./img/nuage2.png",
            brume2: "./img/brume2.png",
            interfaceSkills: "./img/interfaceSkills.png",
            sort: "./img/sort.png",
            sortAppuye: "./img/sortAppuye.png",
            shoot: "./img/shoot.png",
            contourVie: "./img/contourVie.png",
            fondVie: "./img/fondVie.png",
            vie: "./img/vie.png",
            heartLifeBorder: "./img/heartLifeBorder.png",
            heartLifeEmpty: "./img/heartLifeEmpty.png",
            heartLifeFull: "./img/heartLifeFull.png",
            heartLifeRegenerating: "./img/heartLifeRegenerating.png",
            barslide: "./img/barslide.png",
            barslide_bitogno: "./img/barslide_bitogno.png",
            jouer: "./img/jouer.png",
            lore: "./img/lore.png",
            howToPlay: "./img/howToPlay.png",
            options: "./img/options.png",
            retour: "./img/retour.png",
            menu: "./img/menu.png",
            rejouer: "./img/rejouer.png",
            new1: "./img/new1.png",
            new2: "./img/new2.png",
            dieded: "./img/dieded.png",
            tour: "./img/tour.png",
            tour_ombre: "./img/tour_ombre.png",
            joueur: "./img/joueur.png",
            tooClose: "./img/tooClose.png",
            sprite_mob: "./img/sprite_mob.png",
            sprite_mob_reversed: "./img/sprite_mob_reversed.png",
            boutonFond: "./img/boutonFond.png",
            boutonFond_clic: "./img/boutonFond_clic.png",
            boutonFond_focus: "./img/boutonFond_focus.png",
            moinsUn: "./img/moinsUn.png",
            diviseParDeux : "./img/diviseParDeux.png",
            diviseParTrois : "./img/diviseParTrois.png",
            diviseParCinq : "./img/diviseParCinq.png",
            diviseParSept : "./img/diviseParSept.png",
            diviseParOnze : "./img/diviseParOnze.png",
            diviseParDix : "./img/diviseParDix.png",
            diviseParCent : "./img/diviseParCent.png",
            diviseParMille : "./img/diviseParMille.png",
            racineCarree : "./img/racineCarree.png",
            fleche_gauche : "./img/fleche_gauche.png",
            fleche_gauche_clic : "./img/fleche_gauche_clic.png",
            fleche_gauche_focus : "./img/fleche_gauche_focus.png",
            fleche_droite : "./img/fleche_droite.png",
            fleche_droite_clic : "./img/fleche_droite_clic.png",
            fleche_droite_focus: "./img/fleche_droite_focus.png",
            skills_details: "./img/skills_details.png",
        };
        for (let src in sources) {
            cptResources++;
        }

        fontSource.load().then(function (font) {
            document.fonts.add(font);
            currentResourceLoaded++;
        });
        
        for(let src in sources) {
            images[src] = new Image();
            images[src].src = sources[src];
            await images[src].decode();
            currentResourceLoaded++;
        }

        await new Promise(r => setTimeout(r, 100)); // Was triggered that you can't see the X/X loaded resources, you could only see X-1/X...

        // When everything is loaded
        loadGlobalVariables();
        changeState(MENU_STATE);
    }
};

function lancerMenu() {
    let btnJouer = new Button(Game.canvas.width / 2 - 128, Game.canvas.height / 2, images3States.boutonFond, images.jouer);
    let btnLore = new Button(Game.canvas.width / 2 - 128 - 150, Game.canvas.height / 2 + 100, images3States.boutonFond, images.lore);
    let btnHowToPlay = new Button(Game.canvas.width / 2 - 128 + 150, Game.canvas.height / 2 + 100, images3States.boutonFond, images.howToPlay);
    let btnOptions = new Button(Game.canvas.width / 2 - 128, Game.canvas.height / 2 + 200, images3States.boutonFond, images.options);
    let bg = new ImageFull(images.mainBg);
    let fadingBg = new ImageFull(images.mainBg);
    let fadingOpacity = 1;
    if (previousState == OPTIONS_STATE || previousState == LORE_STATE || previousState == HOWTOPLAY_STATE) {
        fadingOpacity = 0; // Cancel the animation
    }

    Game.interval = setInterval(update, 20);

    function update() {
        // Game
        Game.update();

        if (btnJouer.isClicked()) {
            changeState(PLAY_STATE);
        }
        if (btnOptions.isClicked()) {
            changeState(OPTIONS_STATE);
        }
        if (btnLore.isClicked()) {
            changeState(LORE_STATE);
        }
        if (btnHowToPlay.isClicked()) {
            changeState(HOWTOPLAY_STATE);
        }

        bg.update();
        UpdateEclair();

        pluie1.update();
        pluie2.update();
		nuage1.update();
		nuage2.update();

        titre.update();
        btnJouer.update();
        btnLore.update();
        btnHowToPlay.update();
        btnOptions.update();

		brume1.update();
        brume2.update();

        if (fadingOpacity > 0) {
            Game.context.save();
            Game.context.globalAlpha = fadingOpacity;
            fadingOpacity -= 0.01;
            fadingBg.update();
            Game.context.restore();
        }

		Cursor.update();
    };
};

function lancerOptions() {
    let bg = new ImageFull(images.mainBg);
    let btnRetour = new Button(Game.canvas.width / 2 - 128, Game.canvas.height / 2 + 200, images3States.boutonFond, images.retour);

    let baseX = 460;
    let baseY = 420;

    let volumeDsp = new Texte("16px", FONT, "white", baseX, baseY, `Volume :`);
    let barslider = new BarSlider(baseX + 140, baseY - 12, 100, 16);
    barslider.setValeur(Data.volume * 10);

    let keyboardDsp = new Texte("16px", FONT, "white", baseX, baseY + 50, `Keyboard :`);
    let btnFlecheGauche = new Button(baseX + 100, baseY + 30, images3States.fleche_gauche, null);
    let btnFlecheDroite = new Button(baseX + 260, baseY + 30, images3States.fleche_droite, null);
    let keyboards = ["AZERTY", "QWERTY"];
    let currentKeyboardsIndex = keyboards.indexOf(Data.keyboard);
    let currentKeyboardDsp = new Texte("16px", FONT, "white", baseX + 194, baseY + 50, String(`${keyboards[currentKeyboardsIndex]}`));
    currentKeyboardDsp.x = baseX + 194 - (TextWidth(currentKeyboardDsp.text) / 2);

    Game.interval = setInterval(update, 20);

    function update() {
        // Game
        Game.update();

        if (btnRetour.isClicked()) {
            Data.keyboard = keyboards[currentKeyboardsIndex];
            Game.setSkillsKeys();
            saveCookie();
            changeState(MENU_STATE);
        }

        if (btnFlecheGauche.isClicked()) {
            if (currentKeyboardsIndex == 0) {
                currentKeyboardsIndex = keyboards.length - 1;
            }
            else {
                currentKeyboardsIndex--;
            }
        }

        if (btnFlecheDroite.isClicked()) {
            if (currentKeyboardsIndex == keyboards.length - 1) {
                currentKeyboardsIndex = 0;
            }
            else {
                currentKeyboardsIndex++;
            }
        }

        bg.update();
        UpdateEclair();

        pluie1.update();
        pluie2.update();
		nuage1.update();
		nuage2.update();

        titre.update();
        btnRetour.update();
        btnFlecheGauche.update();
        btnFlecheDroite.update();
        currentKeyboardDsp.text = String(`${keyboards[currentKeyboardsIndex]}`);
        currentKeyboardDsp.x = baseX + 194 - (TextWidth(currentKeyboardDsp.text) / 2);
        currentKeyboardDsp.update();

        volumeDsp.update();
        barslider.update();
        keyboardDsp.update();

		brume1.update();
		brume2.update();

		Cursor.update();
        Data.volume = parseInt(barslider.dspCurrent.text) / 10;
        Game.setSoundVolume();
    };
};

function lancerLore() {
    let bg = new ImageFull(images.mainBg);
    let btnRetour = new Button(Game.canvas.width / 2 - 128, Game.canvas.height / 2 + 200, images3States.boutonFond, images.retour);

    let loreTextMargin = 50;
    let loreText = `Back in 2015, during high school, a friend and I came up with the idea of creating a mental arithmetic game. I initially put together a Proof of Concept but soon lost interest and forgot about it. Years later, I stumbled upon the project in my folders and decided to dust it off, making improvements here and there. After several years of on-and-off tinkering, I finally revamped it enough to release the final version. 'Hinnts' is a reference to 'int' in programming, reflecting the core gameplay mechanics of this game. I know what some people might say, but NO, the Papyrus font STAYS ON; it was cool back then. Anyway, enjoy this little game!`;

    Game.interval = setInterval(update, 20);

    function update() {
        // Game
        Game.update();

        if (btnRetour.isClicked()) {
            changeState(MENU_STATE);
        }

        bg.update();
        UpdateEclair();

        pluie1.update();
        pluie2.update();
		nuage1.update();
		nuage2.update();

        btnRetour.update();
      
        PrintWrappingText(loreText, 38, loreTextMargin, 100, CANVAS_WIDTH - loreTextMargin * 2, true);

		brume1.update();
		brume2.update();

		Cursor.update();
    };
};

function lancerHowToPlay() {
    let bg = new ImageFull(images.mainBg);
    let btnRetour = new Button(Game.canvas.width / 2 - 128, Game.canvas.height / 2 + 200, images3States.boutonFond, images.retour);

    let baseX = 50;
    let baseY = 120;
    let maxWidth = 650;

    let title1 = new Texte("38px", FONT, "white", baseX + 650 / 2 - 140, baseY - 40, "Essential Info");
    title1.bold = true;
    title1.underline = true;
    let info1 = "- Press and release skills key to fire their corresponding arithmetic calculation";
    let info2 = "- Hold and scroll up/down to modify a skill key multiplier (when available)";
    let info3 = "- Reduce the enemies' HP to 0 to defeat them properly";
    let info4 = "- Damaging an enemy to a decimal HP makes them explode and causes you to lose a lot of HP. Be careful!";
    let skillsDetails = new ImageSameDim(Game.canvas.width - images.skills_details.width - 50, 100, images.skills_details);
    let keysText = "";
    let spacing = "        ";
    switch (Data.keyboard) {
        case "AZERTY":
            keysText = `A${spacing}Z${spacing}E${spacing}R`;
            break;
        case "QWERTY":
            spacing = spacing.substring(1); // bigger letters
            keysText = `Q${spacing}W${spacing}E${spacing} R`;
            break;
    }
    let keysTextDsp = new Texte("28px", FONT, "white", skillsDetails.x + 40, skillsDetails.y + skillsDetails.height + 16, keysText);
    let title2 = new Texte("38px", FONT, "white", baseX, baseY + 370, "Other tips");
    title2.bold = true;
    title2.underline = true;
    let info5 = "- Cancel an held skill by moving the pointer to the center and releasing the key";
    let info6 = "- The higher the amount of damage dealt to an ennemy, the higher the score you'll obtain!";
    let info7 = "- The more complex the arithmetic operation you use, the higher the score you'll obtain!";

    Game.interval = setInterval(update, 20);

    function update() {
        // Game
        Game.update();

        if (btnRetour.isClicked()) {
            changeState(MENU_STATE);
        }

        bg.update();
        UpdateEclair();

        pluie1.update();
        pluie2.update();
		nuage1.update();
		nuage2.update();

        btnRetour.update();

        title1.update();
        PrintWrappingText(info1, 24, baseX, baseY + 20, maxWidth, false);
        PrintWrappingText(info2, 24, baseX, baseY + 90, maxWidth, false);
        PrintWrappingText(info3, 24, baseX, baseY + 160, maxWidth, false);
        PrintWrappingText(info4, 24, baseX, baseY + 200, maxWidth, false);
        skillsDetails.update();
        keysTextDsp.update();
        title2.update();
        PrintWrappingText(info5, 24, baseX + 220, baseY + 320, maxWidth + 250, false);
        PrintWrappingText(info6, 24, baseX + 220, baseY + 370, maxWidth + 250, false);
        PrintWrappingText(info7, 24, baseX + 220, baseY + 420, maxWidth + 250, false);

		brume1.update();
		brume2.update();

		Cursor.update();
    };
};

function lancerJouer() {
    currentScore = 0;
    LastGameSummary.reset();
    let currentScoreDsp = new Texte("16px", FONT, "white", 10, 20, `Score : ${String(currentScore)}`);
    let shoots = [];
    let attackers = [];
    let def = new Defender(64, 64, images.tour);
    let text = new Texte("16px", FONT, "white", 10, 30, null);
    let skills = new Skills();
    let interfaceSkills = new InterfaceSkills(skills);
    let bg = new ImageFull(images.mainBg);
    let eclairRouge = new ImageFull(images.eclairRouge);
    let doEclairRouge = false;
    let currentSpawn = 0;
    let spawnCount = 0;
    let nextSpawn = 100;
    let isPerdu = false;

    Game.interval = setInterval(update, 20);

    function update() {
        // Game
        Game.update();

        // Skills
        skills.update();

        // Shoots
        let skill = skills.getCastedSkill();
        if (skill !== undefined && !IsTooClose(def.xCenter, def.yCenter, Game.xMouseMove, Game.yMouseMove)) {
            let staffOffsetDist = 50;
            let staffAngle = 7;
            // Calculate angle of defender
            let dxDef = (Game.xMouseMove - def.xCenter);
            let dyDef = (Game.yMouseMove - def.yCenter);
            let angleDef = (Math.atan2(dyDef, dxDef) * (180 / Math.PI) + staffAngle) * (Math.PI / 180);
            // Find the offset of the end of the defender weapon
            let cosAngleDef = Math.cos(angleDef);
            let sinAngleDef = Math.sin(angleDef);
            let staffEndX = def.xCenter + cosAngleDef * staffOffsetDist;
            let staffEndY = def.yCenter + sinAngleDef * staffOffsetDist;
            // Calculate the angle of the shoot
            let dxReal = (Game.xMouseMove - staffEndX);
            let dyReal = (Game.yMouseMove - staffEndY);
            let angleReal = Math.atan2(dyReal, dxReal) / Math.PI * 180;
            let magReal = Math.sqrt(dxReal * dxReal + dyReal * dyReal);
            // Calculate the direction of the shoot
            let xSpeed = (dxReal / magReal);
            let ySpeed = (dyReal / magReal);

            if (dxReal != 0 && dyReal != 0) {
                shoots.push(new Shoot(staffEndX, staffEndY, 16, 8, xSpeed, ySpeed, skill, angleReal));
            }
        }

        // Attackers
        currentSpawn += 1;
        if (currentSpawn == nextSpawn) {
            spawnCount++;
            let minLife = 1;
            let maxLife = Math.round(5 + Math.pow(Game.frameNo, 1.5) / 500);
            let tmpLife = rand(minLife, maxLife); 
            let adjustementPercentage = (tmpLife - maxLife) / maxLife;
            currentSpawn = 0;
            nextSpawn = Math.max(Math.min(Math.round((100 + spawnCount * 25) * Math.abs(adjustementPercentage)), 400), 1);
            //console.log(`minLife=${minLife}, maxLife=${maxLife}, tmpLife=${tmpLife}, adjustementPercentage=${adjustementPercentage}, nextSpawnFormula=${nextSpawnFormula}, nextSpawn=${nextSpawn}`);

            let r = Math.round(Math.random());
            let xRand = (r == 0) ? 0 : Game.canvas.width;
            let yRand = rand(0, Game.canvas.height);
            let dx = (def.xCenter - xRand);
            let dy = (def.yCenter - yRand);
            let mag = Math.sqrt(dx * dx + dy * dy);

            if (tmpLife > 20) {
                if (!LastGameSummary.youCouldHaveList.some(e => e.tmpLife === tmpLife)) {
                    if (Math.sqrt(tmpLife) % 1 === 0) {
                        LastGameSummary.youCouldHaveList.push(new YouCouldHaveStat(tmpLife, DMG_RULE_SQUARE, null));
                    }
                    else if ((tmpLife / 11) % 1 === 0) {
                        LastGameSummary.youCouldHaveList.push(new YouCouldHaveStat(tmpLife, DMG_RULE_DIVIDE, 11));
                    }
                    else if ((tmpLife / 7) % 1 === 0) {
                        LastGameSummary.youCouldHaveList.push(new YouCouldHaveStat(tmpLife, DMG_RULE_DIVIDE, 7));
                    }
                    else if ((tmpLife / 3) % 1 === 0) {
                        LastGameSummary.youCouldHaveList.push(new YouCouldHaveStat(tmpLife, DMG_RULE_DIVIDE, 3));
                    }
                }
            }

            attackers.push(new Attacker(48, 48, images.sprite_mob, images.sprite_mob_reversed, xRand, yRand, (dx / mag), (dy / mag), r, tmpLife));
        }

        // collide
        for (i = 0; i < attackers.length; i += 1) {
            for (j = 0; j < shoots.length; j += 1) {
                if (shoots[j] != null && attackers[i] != null) {
                    if (attackers[i].dead == false && shoots[j].crashWith(attackers[i])) {
                        attackers[i].decreaseLife(shoots[j].skill);
                        shoots.splice(j, 1);
                        if (attackers[i].ERROR_IN_LIFE) {
                            def.decreaseLife(1);
                            doEclairRouge = true;
                        }
                    }
                }
            }
        }

        for (i = 0; i < attackers.length; i += 1) {
            if (attackers[i].crashWith(def) && attackers[i].dead == false) {
                def.decreaseLife(1);
                attackers[i].dieded();
                doEclairRouge = true;
            }
        }

		for (i = 0; i < attackers.length; i += 1) {
			if (attackers[i].sprite.end) {
				attackers.splice(i, 1);
			}
		}

        if (def.life.currHP <= 0 && !isPerdu) {
            isPerdu = true;
            changeState(LOST_STATE);
        }

        // update
        bg.update();

        def.update();

        for (i = 0; i < attackers.length; i += 1) {
            if (outOfCanvas(attackers[i], Game.canvas)) {
                attackers.splice(i, 1);
            } else {
                attackers[i].newPos();
                attackers[i].update();
            }
        }

        for (i = 0; i < shoots.length; i += 1) {
            if (outOfCanvas(shoots[i], Game.canvas)) {
                shoots.splice(i, 1);
            } else {
                shoots[i].newPos();
                shoots[i].update();
            }
        }

        if (eclairRouge.time != 0 && eclairRouge.time != undefined) {
            eclairRouge.update();
            eclairRouge.time--;
        }
        else if (doEclairRouge) {
            doEclairRouge = false;
            eclairRouge.time = 5;
        }

        pluie1.update();
        pluie2.update();
		nuage1.update();
		nuage2.update();
		brume1.update();
		brume2.update();

        interfaceSkills.update();
        def.life.update();

        currentScoreDsp.text = `Score : ${String(currentScore)}`;
        currentScoreDsp.update();

		Cursor.update();
    };
};

function IsTooClose(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var res = Math.sqrt(dx * dx + dy * dy);
    if (res < 50) {
        return true;
    }
    else {
        return false;
    }
}

function lancerPerdu() {
    let bg = new ImageFull(images.mainBg);
    let eclairRouge = new ImageFull(images.eclairRouge);
    let btnRejouer = new Button(Game.canvas.width / 2 - 128 - 150, Game.canvas.height / 2 + 300, images3States.boutonFond, images.rejouer);
    let btnMenu = new Button(Game.canvas.width / 2 - 128 + 150, Game.canvas.height / 2 + 300, images3States.boutonFond, images.menu);
    let diededTitre = new ImageSameDim(Game.canvas.width / 2 - images.dieded.width / 2, 0, images.dieded);

    let baseX = 50;
    let baseY = 380;

    let finalScoreTexteDsp = new Texte("42px", FONT, "white", baseX + 50, baseY, `Final score`);
    let finalScoreDsp = new Texte("120px", FONT, "white", baseX + 150, baseY + 100, `${(currentScore == undefined ? 'none' : String(currentScore))}`);
    finalScoreDsp.centered = true;
    let previousHighscore = Data.highestScore;
    let previousHighscoreDsp = new Texte("24px", FONT, "white", baseX + 50, baseY + 200, `(previous : ${(previousHighscore == undefined ? 'none' : previousHighscore)})`);

    let isNewHighscore = false;
    if (currentScore != undefined) {
        if ((Data.highestScore == undefined || currentScore > Data.highestScore) && currentScore > 0) {
            isNewHighscore = true;
            Data.highestScore = currentScore;
            saveCookie();
        }
    }

    let highscoreDsp = new Texte("24px", FONT, "white", baseX + 50, baseY + 160, `Highscore : ${(Data.highestScore == undefined ? 'none' : String(Data.highestScore))}`);
    let new1 = new ImageSameDim(baseX + 230, baseY + 135, images.new1);
    let new2 = new ImageSameDim(baseX + 230, baseY + 135, images.new2);


    let killCountDsp = new Texte("26px", FONT, "white", baseX + 450, baseY - 80, "Gracefully killed ennemy count : ");
    let killCountVal = new Texte("26px", FONT, "white", baseX + 820, baseY - 80, `${(LastGameSummary.killCount == undefined ? 0 : LastGameSummary.killCount)}`);

    let highestDamageDealtDsp = new Texte("26px", FONT, "white", baseX + 450, baseY - 40, "Highest damage dealt : ");
    let highestDamageDealtVal = new Texte("26px", FONT, "white", baseX + 820, baseY - 40, `${(LastGameSummary.highestDamageDealt == undefined ? 0 : LastGameSummary.highestDamageDealt)}`);

    let highestEnnemyHpDefeatedDsp = new Texte("26px", FONT, "white", baseX + 450, baseY, "Highest HP ennemy defeated : ");
    let highestEnnemyHpDefeatedVal = new Texte("26px", FONT, "white", baseX + 820, baseY, `${(LastGameSummary.highestEnnemyHpDefeated == undefined ? 0 : LastGameSummary.highestEnnemyHpDefeated)}`);

    let atLeastOneYouCouldHave = false;
    let youCouldHaveDsp = new Texte("26px", FONT, "white", baseX + 450, baseY + 80, "You could have...");
    let youCouldHaveDsp1 = new Texte("26px", FONT, "white", baseX + 480, baseY + 120, "");
    let youCouldHaveDsp2 = new Texte("26px", FONT, "white", baseX + 480, baseY + 160, "");
    let youCouldHaveDsp3 = new Texte("26px", FONT, "white", baseX + 480, baseY + 200, "");
    let youCouldHaveListFiltered = LastGameSummary.youCouldHaveList.filter(e => !e.done).sort(e => e.tmpLife * -1);
    if (youCouldHaveListFiltered.length > 0) {
        atLeastOneYouCouldHave = true;
        if (youCouldHaveListFiltered.length == 1) {
            youCouldHaveDsp1.text = youCouldHaveListFiltered[0].toClearString();
        }
        else if (youCouldHaveListFiltered.length == 2) {
            youCouldHaveDsp1.text = youCouldHaveListFiltered[1].toClearString();
            youCouldHaveDsp2.text = youCouldHaveListFiltered[0].toClearString();
        }
        else {
            youCouldHaveDsp1.text = youCouldHaveListFiltered[2].toClearString();
            youCouldHaveDsp2.text = youCouldHaveListFiltered[1].toClearString();
            youCouldHaveDsp3.text = youCouldHaveListFiltered[0].toClearString();
        }
    }

    Game.interval = setInterval(update, 40);

    function update() {
        Game.update();

        if (btnRejouer.isClicked()) {
            changeState(PLAY_STATE);
        }
        if (btnMenu.isClicked()) {
            changeState(MENU_STATE);
        }

        bg.update();
        UpdateEclair();

        pluie1.update();
        pluie2.update();
		nuage1.update();
        nuage2.update();

        eclairRouge.update();

        diededTitre.update();
        btnRejouer.update();
        btnMenu.update();

        finalScoreTexteDsp.update();
        finalScoreDsp.update();
        highscoreDsp.update();

        if (isNewHighscore) {
            previousHighscoreDsp.update();
            new1.update();
            if (new2.time != 0 && new2.time != undefined) {
                new2.time--;
                if (new2.time < 20) {
                    new2.update();
                }
            }
            else {
                new2.time = 40;
            }
        }

        highestDamageDealtDsp.update();
        highestDamageDealtVal.update();

        killCountDsp.update();
        killCountVal.update();

        highestEnnemyHpDefeatedDsp.update();
        highestEnnemyHpDefeatedVal.update();

        if (atLeastOneYouCouldHave) {
            youCouldHaveDsp.update();
            youCouldHaveDsp1.update();
            youCouldHaveDsp2.update();
            youCouldHaveDsp3.update();
        }

		brume1.update();
		brume2.update();

		Cursor.update();
    };
};

function UpdateEclair() {
    let eclair1ToUpdate = false;
    let eclair1IsNew = false;
    let eclair2ToUpdate = false;

    // 1er eclair
    if (eclair1.time != undefined && eclair1.time != 0) {
        eclair1ToUpdate = true;
        eclair1.time--;
    }
    else if (rand(0, 100) == 1) {
        eclair1.time = rand(4, 8)
        eclair1ToUpdate = true;
        eclair1IsNew = true;
    }

    // 2eme eclair
    if (eclair2.time != undefined && eclair2.time != 0) {
        eclair2ToUpdate = true;
        eclair2.time--;
    }
    else if (eclair1.time > 1 && rand(0, 5) == 1) {
        eclair2.time = rand(1, eclair1.time)
        eclair2ToUpdate = true;
    }

    // Opacité
    if (eclair1ToUpdate) {
        if (eclair1IsNew) {
            Game.context.save();
            Game.context.globalAlpha = 0.5;
        }

        eclair1.update();
        if (eclair2ToUpdate) {
            eclair2.update();
        }

        if (eclair1IsNew) {
            Game.context.restore();
        }
    }
}

function loadGlobalVariables() {
    titre = new ImageSameDim(Game.canvas.width / 2 - images.titre.width / 2, 50, images.titre);
    pluie1 = new ImageFull(images.pluie);
    pluie1.setSpeed(6, 15);
    pluie2 = new ImageFull(images.pluie);
    pluie2.x += 20;
    pluie2.y += 20;
    pluie2.setSpeed(4, 9);
    eclair1 = new ImageFull(images.eclair);
    eclair2 = new ImageFull(images.eclair);
    nuage1 = new ImageFull(images.nuage1);
    nuage1.setSpeed(1,0);
    brume1 = new ImageFull(images.brume1);
    brume1.setSpeed(2,0);
    nuage2 = new ImageFull(images.nuage2);
    nuage2.setSpeed(-1,0);
    brume2 = new ImageFull(images.brume2);
    brume2.setSpeed(-2,0);

    images3States.boutonFond = {
        normal: images.boutonFond,
        clicked: images.boutonFond_clic,
        focused: images.boutonFond_focus
    };

    images3States.fleche_gauche = {
        normal: images.fleche_gauche,
        clicked: images.fleche_gauche_clic,
        focused: images.fleche_gauche_focus
    };

    images3States.fleche_droite = {
        normal: images.fleche_droite,
        clicked: images.fleche_droite_clic,
        focused: images.fleche_droite_focus
    };
}
///////////////////////

/* Fonctions utiles */
function changeState(newState) {
    clearInterval(Game.interval);
    Game.frameNo = 0;
    previousState = currentState;
    currentState = newState;
    if (newState == LOADING_STATE) {
        lancerChargement();
    }
    if (newState == PLAY_STATE) {
        lancerJouer();
    }
    else if (newState == LOST_STATE) {
        lancerPerdu();
    }
    else if (newState == MENU_STATE) {
        lancerMenu();
    }
    else if (newState == OPTIONS_STATE) {
        lancerOptions();
    }
    else if (newState == LORE_STATE) {
        lancerLore();
    }
    else if (newState == HOWTOPLAY_STATE) {
        lancerHowToPlay();
    }
};

function outOfCanvas(object, canvas) {
    if (object.x < -50 || object.x > canvas.width + 50 || object.y < -50 || object.y > canvas.height + 50) {
        return true;
    } else {
        return false;
    }
};

function everyInterval(n) {
    if ((Game.frameNo / n) % 1 == 0) {
        return true;
    }
    return false;
};

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
};

async function NewImage(url) {
    let img = new Image();
    img.src = url;
    await img.decode();
    return img;
}

function TextWidth(txt) {
    return Game.context.measureText(txt).width;
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function PrintWrappingText(text, fontSize, x, y, fitWidth, center) {
    Game.context.save();
    Game.context.font = `${fontSize}px ${FONT}`;
    fitWidth = fitWidth || 0;

    if (fitWidth <= 0) {
        Game.context.fillText(text, x, y);
        return;
    }
    var words = text.split(' ');
    var currentLine = 0;
    var idx = 1;
    while (words.length > 0 && idx <= words.length) {
        var str = words.slice(0, idx).join(' ');
        var w = Game.context.measureText(str).width;
        if (w > fitWidth) {
            if (idx == 1) {
                idx = 2;
            }
            var textToRender = words.slice(0, idx - 1).join(' ');
            var textOffset = 0;
            if (center) {
                var textWidth = Game.context.measureText(textToRender).width;
                textOffset = (fitWidth - textWidth) / 2;
            }
            Game.context.fillText(textToRender, x + textOffset, y + (fontSize * 1.3 * currentLine));
            currentLine++;
            words = words.splice(idx - 1);
            idx = 1;
        }
        else { idx++; }
    }
    if (idx > 0) {
        var textToRender = words.join(' ');
        var textOffset = 0;
        if (center) {
            var textWidth = Game.context.measureText(textToRender).width;
            textOffset = (fitWidth - textWidth) / 2;
        }
        Game.context.fillText(textToRender, x + textOffset, y + (fontSize * 1.3 * currentLine));
    }
    Game.context.restore();
}

///////////////////////


/* Fonctions cookiz */
function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    //let expires = "expires=-99999"; // Test suppression
    document.cookie = cname + "=" + cvalue + "; " + expires + "; SameSite=Strict";
};

function getCookie(name) {
    let nameEQ = name + "=";
    let cookie = document.cookie.split(';');
    if (cookie[0]) {
        return JSON.parse(cookie[0].replace(nameEQ, ""));
    }
    else {
        return {};
    }
};

function checkCookie(name) {
    let save = getCookie(name);
    if (!isEmpty(save)) {
        load(save);
        return true;
    } else {
        return false;
    }
};

function saveCookie() {
    setCookie(MAIN_COOKIE, JSON.stringify(Data), 365);
};

function load(save) {
    if (save.highestScore !== undefined) {
        Data.highestScore = save.highestScore;
    }
    if (save.volume !== undefined) {
        Data.volume = save.volume;
    }
    if (save.keyboard !== undefined) {
        Data.keyboard = save.keyboard;
    }
};
///////////////////////
