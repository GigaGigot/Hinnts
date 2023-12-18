// constantes
let MAIN_COOKIE = "saveHinnts";
let CANVAS_WIDTH = 1200;
let CANVAS_HEIGHT = 800;
let FONT = "Papyrus";
let KEY_SKILL_1, KEY_SKILL_2, KEY_SKILL_3, KEY_SKILL_4;
let LOADING_STATE = "LOADING_STATE", PLAY_STATE = "PLAY_STATE", LOST_STATE = "LOST_STATE", MENU_STATE = "MENU_STATE", OPTIONS_STATE = "OPTIONS_STATE";

// Common content
let images = {};
let images3States = {};
let titre, pluie1, pluie2, eclair, nuage1, brume1, nuage2, brume2;
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
	checkCookie(MAIN_COOKIE);
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
            this.music = new Sound("./sound/soundtrack.wav", true);
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
        audios.forEach(audio => audio.sound.volume = 0.1 * Data.volume);
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
        { code: "moinsUn", image: images.moinsUn, dmg: 1, dmgRule: "fixe", score: 1, scoreRule: "none"}
    ],
    this.skillsPos1 = 0,
    this.skills2 = [
        { code: "diviseParDeux", image: images.diviseParDeux, dmg: 2, dmgRule: "divide", score: 2, scoreRule: "hp_loss"},
        { code: "diviseParTrois", image: images.diviseParTrois, dmg: 3, dmgRule: "divide", score: 3, scoreRule: "hp_loss"},
        { code: "diviseParCinq", image: images.diviseParCinq, dmg: 5, dmgRule: "divide", score: 5, scoreRule: "hp_loss"},
        { code: "diviseParSept", image: images.diviseParSept, dmg: 7, dmgRule: "divide", score: 7, scoreRule: "hp_loss"},
        { code: "diviseParOnze", image: images.diviseParOnze, dmg: 11, dmgRule: "divide", score: 11, scoreRule: "hp_loss"}
    ],
    this.skillsPos2 = 0,
    this.skills3 = [
        { code: "diviseParDix", image: images.diviseParDix, dmg: 10, dmgRule: "divide", score: 10, scoreRule: "hp_loss"},
        { code: "diviseParCent", image: images.diviseParCent, dmg: 100, dmgRule: "divide", score: 100, scoreRule: "hp_loss"},
        { code: "diviseParMille", image: images.diviseParMille, dmg: 1000, dmgRule: "divide", score: 1000, scoreRule: "hp_loss"}
    ],
    this.skillsPos3 = 0,
    this.skills4 =  [
        { code: "racineCarree", image: images.racineCarree, dmg: 0, dmgRule: "square", score: 0, scoreRule: "square"}
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
    this.xCenter = this.x + (this.width / 2);
    this.yCenter = this.y + (this.height / 2);
    this.life = new LifeBar(Game.canvas.width / 2 - 150, Game.canvas.height - 70, 100);
    this.sprite = new Sprite(this.x, this.y, width, height, sprite, 0);
	this.ombre = new SpriteAnimated(this.x - 16, this.y - 12.5, 100, 120, images.tour_ombre, 0, 5);
    this.update = function () {
        if (everyInterval(50) && this.life.currHP < this.life.maxHP) {
            this.life.currHP++;
        }
        this.sprite.update();
		//this.ombre.update();
    }
    this.decreaseLife = function (dmg) {
        this.life.currHP -= dmg;
        if (this.life.currHP < 0) {
            this.life.currHP = 0;
        }
    }
};

function Attacker(width, height, image, x, y, xSpeed, ySpeed, flip, life) {
    this.width = width;
    this.height = height;
    this.x = x - width / 2;
    this.y = y - height / 2;
    this.xCenter = x + (width / 2);
    this.yCenter = y + (height / 2);
    this.speed = 0.1 * rand(2,5);
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
    this.dead = false;
    this.ERROR_IN_LIFE = false;
    this.life = life;
    this.lifeDsp = new Text("16px", FONT, "white", x + TextWidth(String(this.life)), y - 2, String(this.life));
    this.sprite = new SpriteAnimated(x, y, width, height, image, flip, 5);
    this.update = function () {
		if (this.dead == false) {
			this.lifeDsp.newPos(this.x + TextWidth(String(this.life)), this.y - 2);
			this.lifeDsp.update();
		}
        this.sprite.update();
    }
    this.newPos = function () {
		if (this.dead == false) {
			this.x += this.xSpeed * this.speed;
			this.y += this.ySpeed * this.speed;
			this.sprite.x = this.x;
			this.sprite.y = this.y;
		}
    }
    this.crashWith = function (otherobj) {
        let myleft = this.x;
        let myright = this.x + (this.width);
        let mytop = this.y;
        let mybottom = this.y + (this.height);
        let otherleft = otherobj.x;
        let otherright = otherobj.x + (otherobj.width);
        let othertop = otherobj.y;
        let otherbottom = otherobj.y + (otherobj.height);
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
        if (skill.dmgRule == "fixe") {
            newLife -= skill.dmg;
        }
        else if (skill.dmgRule == "divide") {
            newLife /= skill.dmg;
        }
        else if (skill.dmgRule == "square") {
            newLife = Math.sqrt(oldLife);
        }

        if (newLife % 1 !== 0) {
            this.ERROR_IN_LIFE = true;
            this.dieded();
        }
        else {
            // Do score
            if (skill.scoreRule == "none") {
                currentScore += skill.score;
            }
            else if (skill.scoreRule == "hp_loss") {
                currentScore += (oldLife - newLife) * skill.score;
            }
            else if (skill.scoreRule == "square") {
                currentScore += (oldLife - newLife) * newLife;
            }

            this.life = newLife;
            this.lifeDsp.text = this.life;

            if (newLife <= 0) {
                this.dieded();
            }
        }
    }
	this.dieded = function () {
		this.dead = true;
		this.sprite.deathAnimation = true;
	}
};

function Shoot(x, y, width, height, xSpeed, ySpeed, skill, angle) {
    this.x = x - width / 2;
    this.y = y - height / 2;
    this.width = width;
    this.height = height;
    this.speed = 5;
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
        let otherleft = otherobj.x;
        let otherright = otherobj.x + (otherobj.width);
        let othertop = otherobj.y;
        let otherbottom = otherobj.y + (otherobj.height);
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

function SpriteAnimated(x, y, width, height, image, flip, vitesse) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = new Image();
    this.image = image;
    this.nbFrames = this.image.width / this.width;
    this.frameNo = 0;
    this.flip = flip;
	this.vitesse = vitesse;
	this.deathAnimation = false;
	this.cptDeathAnimation = 0;
	this.end = false;
    this.update = function () {
        ctx = Game.context;
		if (this.deathAnimation) {
        	ctx.drawImage(this.image, this.width * this.frameNo, this.height * 2, this.width, this.height, this.x, this.y, this.width, this.height);
		} else {
        	ctx.drawImage(this.image, this.width * this.frameNo, this.height * this.flip, this.width, this.height, this.x, this.y, this.width, this.height);
		}
        if (everyInterval(this.vitesse)) {
            this.frameNo++;
			if (this.deathAnimation == true) {
				this.cptDeathAnimation++;
			}
        }
        if (this.frameNo == this.nbFrames && this.deathAnimation == false) {
            this.frameNo = 0;
        }

		if (this.cptDeathAnimation == this.nbFrames+1) {
			this.end = true;
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

function Text(size, font, color, x, y, text) {
    this.size = size;
    this.font = font;
    this.x = x;
    this.y = y;
    if (text != null) {
        this.text = text;
    }
    this.update = function () {
        ctx = Game.context;
        ctx.font = this.size + " " + this.font;
        ctx.fillStyle = color;
        ctx.fillText(this.text, this.x, this.y);
    }
    this.newPos = function (x, y) {
        this.x = x;
        this.y = y;
    }
};

function LifeBar(x, y, maxHP) {
    this.contour = new ImageSameDim(x - 3, y, images.contourVie);
    this.fond = new ImageSameDim(x, y + 3, images.fondVie);
    this.vie = new ImageSameDim(x, y + 3, images.vie);
    this.dspVie = new Text("14px", FONT, "white", x + 135, y + 13, String(this.vie));
    this.maxHP = maxHP;
    this.currHP = maxHP;
    this.update = function () {
        this.contour.update();
        this.fond.update();
        this.vie.width = (this.currHP * this.fond.width) / 100;
        this.vie.update();
        this.dspVie.text = this.currHP;
        this.dspVie.x = this.fond.x + (this.fond.width / 2) - (TextWidth(this.dspVie.text) / 2);
        this.dspVie.update();
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
    this.dspMin = new Text("14px", FONT, "white", x-20, y + 12, String(this.min));
    this.dspMax = new Text("14px", FONT, "white", x + width + 10, y + 12, String(this.max));
    this.dspCurrent = new Text("14px", FONT, "white", x, y - 6, null);
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
    let currentLoadedImagesText = new Text("24px", FONT, "white", Game.canvas.width / 2, Game.canvas.height / 2, `Loading resources...`);
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
            barslide: "./img/barslide.png",
            barslide_bitogno: "./img/barslide_bitogno.png",
            jouer: "./img/jouer.png",
            options: "./img/options.png",
            retour: "./img/retour.png",
            menu: "./img/menu.png",
            rejouer: "./img/rejouer.png",
            new1: "./img/new1.png",
            new2: "./img/new2.png",
            dieded: "./img/dieded.png",
            tour: "./img/tour.png",
            tour_ombre : "./img/tour_ombre.png",
            sprite_feu: "./img/sprite_feu.png",
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
            fleche_droite_focus : "./img/fleche_droite_focus.png",
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
    let btnOptions = new Button(Game.canvas.width / 2 - 128, Game.canvas.height / 2 + 100, images3States.boutonFond, images.options);
    let bg = new ImageFull(images.mainBg);
    let fadingBg = new ImageFull(images.mainBg);
    let fadingOpacity = 1;
    if (previousState == OPTIONS_STATE) {
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

        bg.update();
		if (eclair.time != 0 && eclair.time != undefined) {
			eclair.update();
			eclair.time--;
		}
		else if (rand(0, 100) == 1) {
			eclair.time = rand(4, 8)
			eclair.update();
		}

        pluie1.update();
        pluie2.update();
		nuage1.update();
		nuage2.update();

        titre.update();
        btnJouer.update();
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
    let btnRetour = new Button(Game.canvas.width / 2 - 128, Game.canvas.height / 2 + 100, images3States.boutonFond, images.retour);

    let baseX = 460;
    let baseY = 370;

    let volumeDsp = new Text("16px", FONT, "white", baseX, baseY, `Volume :`);
    let barslider = new BarSlider(baseX + 140, baseY - 12, 100, 16);
    barslider.setValeur(Data.volume * 10);

    let keyboardDsp = new Text("16px", FONT, "white", baseX, baseY + 50, `Keyboard :`);
    let btnFlecheGauche = new Button(baseX + 100, baseY + 30, images3States.fleche_gauche, null);
    let btnFlecheDroite = new Button(baseX + 260, baseY + 30, images3States.fleche_droite, null);
    let keyboards = ["AZERTY", "QWERTY"];
    let currentKeyboardsIndex = keyboards.indexOf(Data.keyboard);
    let currentKeyboardDsp = new Text("16px", FONT, "white", baseX + 194, baseY + 50, String(`${keyboards[currentKeyboardsIndex]}`));
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
            if (currentKeyboardsIndex != 0) {
                currentKeyboardsIndex--;
            }
        }

        if (btnFlecheDroite.isClicked()) {
            if (currentKeyboardsIndex != keyboards.length - 1) {
                currentKeyboardsIndex++;
            }
        }

        bg.update();
		if (eclair.time != 0 && eclair.time != undefined) {
			eclair.update();
			eclair.time--;
		}
		else if (rand(0, 100) == 1) {
			eclair.time = rand(4, 8)
			eclair.update();
		}

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

function lancerJouer() {
    currentScore = 0;
    let currentScoreDsp = new Text("16px", FONT, "white", 10, 20, `Score : ${String(currentScore)}`);
    let shoots = [];
    let attackers = [];
    let def = new Defender(64, 95, images.tour);
    let text = new Text("16px", FONT, "white", 10, 30, null);
    let skills = new Skills();
    let interfaceSkills = new InterfaceSkills(skills);
    let bg = new ImageFull(images.mainBg);
    let eclairRouge = new ImageFull(images.eclairRouge);
    let doEclairRouge = false;
    let currentSpawn = 0;
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
        if (skill !== undefined) {
            let dx = (Game.xMouseMove - def.xCenter);
            let dy = (Game.yMouseMove - def.yCenter);
            let mag = Math.sqrt(dx * dx + dy * dy);
            let angle = Math.atan2(Game.yMouseMove - def.yCenter, Game.xMouseMove - def.xCenter) / Math.PI * 180;

            if (dx != 0 && dy != 0) {
                shoots.push(new Shoot(def.xCenter, def.yCenter, 16, 10, (dx / mag), (dy / mag), skill, angle));
            }
        }

        // Attackers
        currentSpawn += 1;
        if (currentSpawn == nextSpawn) {
            let minLife = 1;
            let maxLife = Math.round(5 + Math.pow(Game.frameNo, 1.2) / 250);
            let tmpLife = rand(minLife, maxLife);
            let adjustementPercentage = (tmpLife - maxLife) / maxLife;
            currentSpawn = 0;
            let nextSpawnFormula = Math.pow(Game.frameNo, 1.2) / 500;
            nextSpawn += Math.round(nextSpawnFormula + nextSpawnFormula * adjustementPercentage);
            //console.log(`minLife=${minLife}, maxLife=${maxLife}, tmpLife=${tmpLife}, adjustementPercentage=${adjustementPercentage}, nextSpawnFormula=${nextSpawnFormula}, nextSpawn=${nextSpawn}`);

            let r = Math.round(Math.random());
            let xRand = (r == 0) ? 0 : Game.canvas.width;
            let yRand = rand(0, Game.canvas.height);
            let dx = (def.xCenter - xRand);
            let dy = (def.yCenter - yRand);
            let mag = Math.sqrt(dx * dx + dy * dy);

            attackers.push(new Attacker(32, 32, images.sprite_feu, xRand, yRand, (dx / mag), (dy / mag), r, tmpLife));
        }

        // collide
        for (i = 0; i < attackers.length; i += 1) {
            for (j = 0; j < shoots.length; j += 1) {
                if (shoots[j] != null && attackers[i] != null) {
                    if (attackers[i].dead == false && shoots[j].crashWith(attackers[i])) {
                        attackers[i].decreaseLife(shoots[j].skill);
                        shoots.splice(j, 1);
                        if (attackers[i].ERROR_IN_LIFE) {
                            def.decreaseLife(50);
                            doEclairRouge = true;
                        }
                    }
                }
            }
        }

        for (i = 0; i < attackers.length; i += 1) {
            if (attackers[i].crashWith(def) && attackers[i].dead == false) {
                def.decreaseLife(attackers[i].life);
                attackers[i].dieded();
                doEclairRouge = true;
            }
        }

		for (i = 0; i < attackers.length; i += 1) {
			if (attackers[i].sprite.end) {
				attackers.splice(i, 1);
			}
		}

        if (def.life.currHP == 0 && !isPerdu) {
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

function lancerPerdu() {
    let bg = new ImageFull(images.mainBg);
    let eclairRouge = new ImageFull(images.eclairRouge);
    let btnRejouer = new Button(Game.canvas.width / 2 - 128, Game.canvas.height / 2, images3States.boutonFond, images.rejouer);
    let btnMenu = new Button(Game.canvas.width / 2 - 128, Game.canvas.height / 2 + 100, images3States.boutonFond, images.menu);
    let diededTitre = new ImageSameDim(Game.canvas.width / 2 - images.dieded.width / 2, 0, images.dieded);

    let baseX = 520;
    let baseY = 270;

    let finalScoreDsp = new Text("24px", FONT, "white", baseX, baseY, `Final score : ${(currentScore == undefined ? 'none' : String(currentScore))}`);
    let previousHighscore = Data.highestScore;
    let previousHighscoreDsp = new Text("24px", FONT, "white", baseX, baseY + 100, `(previous : ${(previousHighscore == undefined ? 'none' : previousHighscore)})`);

    let isNewHighscore = false;
    if (currentScore != undefined) {
        if (Data.highestScore == undefined || currentScore > Data.highestScore) {
            isNewHighscore = true;
            Data.highestScore = currentScore;
            saveCookie();
        }
    }

    let highscoreDsp = new Text("24px", FONT, "white", baseX, baseY + 50, `Highscore : ${(Data.highestScore == undefined ? 'none' : String(Data.highestScore))}`);
    let new1 = new ImageSameDim(baseX + 160, baseY + 25, images.new1);
    let new2 = new ImageSameDim(baseX + 160, baseY + 25, images.new2);

    Game.interval = setInterval(update, 40);

    function update() {
        // Game
        Game.update();

        if (btnRejouer.isClicked()) {
            changeState(PLAY_STATE);
        }
        if (btnMenu.isClicked()) {
            changeState(MENU_STATE);
        }

        bg.update();
		if (eclair.time != 0 && eclair.time != undefined) {
			eclair.update();
			eclair.time--;
		}
		else if (rand(0, 100) == 1) {
			eclair.time = rand(4, 8)
			eclair.update();
		}

        eclairRouge.update();

        pluie1.update();
        pluie2.update();
		nuage1.update();
		nuage2.update();

        diededTitre.update();
        btnRejouer.update();
        btnMenu.update();

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

		brume1.update();
		brume2.update();

		Cursor.update();
    };
};

function loadGlobalVariables() {
    titre = new ImageSameDim(Game.canvas.width / 2 - images.titre.width / 2, 50, images.titre);
    pluie1 = new ImageFull(images.pluie);
    pluie1.setSpeed(6, 15);
    pluie2 = new ImageFull(images.pluie);
    pluie2.x += 20;
    pluie2.y += 20;
    pluie2.setSpeed(4, 9);
    eclair = new ImageFull(images.eclair);
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
///////////////////////


/* Fonctions cookiz */
function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
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
    if ((save || {}) != {}) {
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
