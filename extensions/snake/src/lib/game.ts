import { getRandomInt } from "./utils";

const foodSymbol = "O";
const wallSymbol = "#";
const snakeSymbol = "X";
const emptySymbol = " ";

function addCoords(c1: Coord, c2: Coord): Coord {
    return { x: c1.x + c2.x, y: c1.y + c2.y };
}

export interface GameScore {
    food: number;
    speed: number;
}

export interface Coord {
    x: number,
    y: number
}

export enum Move {
    up,
    down,
    left,
    right
}

class Snake {
    head: Coord;
    body: Coord[];
    bodyLength = 3;

    constructor(startPos: Coord) {
        this.head = startPos;
        this.body = [];
    }

    move(relCoord: Coord, game: Game) {
        const field = game.field;
        const newPos = addCoords(this.head, relCoord);
        const ev = field.getValue(newPos);
        if (ev === foodSymbol) {
            this.bodyLength += 1;
            game.increaseFood();
            game.spawnFood();
        } else if (ev === wallSymbol || ev === undefined || ev === snakeSymbol || !game.field.isValidCoord(newPos)) {
            game.setMessage("Game Over 😝");
            return;
        }

        field.setValue(newPos, snakeSymbol);

        const drawBody = (symbol: string) => {
            for (const c of this.body) {
                field.setValue(c, symbol);
            }
        }
        drawBody(emptySymbol);
        this.body = [this.head].concat(this.body);
        this.body = this.body.slice(0, this.bodyLength);
        drawBody(snakeSymbol);
        this.head = newPos;
    }

}

export class Field {
    width = 100;
    height = 18;
    data: string[] = [];
    constructor() {
        this.clearField();
    }

    clearField() {
        const result: string[] = [];
        for (let i = 0; i < this.height * this.width; i++) {
            result.push(emptySymbol);
        }
        this.data = result;
    }

    isValidCoord(coord: Coord) {
        if (coord.x < 0 || coord.y < 0) {
            return false;
        }
        if (coord.x >= this.width || coord.y > this.height) {
            return false;
        }
        return true;
    }

    coordToIndex(coord: Coord): number {
        return (this.width * coord.y) + coord.x;
    }

    getValue(coord: Coord): string {
        const i = this.coordToIndex(coord);
        return this.data[i];
    }

    setValue(coord: Coord, value: string) {
        const i = this.coordToIndex(coord);
        this.data[i] = value;
    }

    public isFieldFull(): boolean {
        for (const d of this.data) {
            if (d === emptySymbol) {
                return false;
            }
        }
        return true;
    }

    public toString(): string {
        let result = "\n";
        for (let y = -1; y <= this.height; y++) {
            for (let x = -1; x <= this.width; x++) {
                let v = emptySymbol;
                if (y == -1 || y === this.height || x == -1 || x === this.width) {
                    v = wallSymbol;
                } else {
                    v = this.getValue({ x, y });
                    if (!v) {
                        console.log(`value of ${x}, ${y} is undefined`);
                    }
                }
                result += v;
            }
            result += "\n";
        }
        return result;
    }
}

export class Game {
    public field: Field = new Field();
    private setField: React.Dispatch<React.SetStateAction<string>>;
    private timeout: NodeJS.Timeout | undefined;
    private snakeDirection: Move = Move.right;
    public error: string | undefined;
    public setError: React.Dispatch<React.SetStateAction<string | undefined>>;
    public setMessage: React.Dispatch<React.SetStateAction<string | undefined>>;
    public setScore: React.Dispatch<React.SetStateAction<GameScore | undefined>>;
    private snake: Snake;
    private foodCount = 0;
    public speedMs = 1000;
    public speed = 1;

    constructor(setField: React.Dispatch<React.SetStateAction<string>>,
        setError: React.Dispatch<React.SetStateAction<string | undefined>>,
        setScore: React.Dispatch<React.SetStateAction<GameScore | undefined>>,
        setMessage: React.Dispatch<React.SetStateAction<string | undefined>>) {
        this.setField = setField;
        this.setError = setError;
        this.setScore = setScore;
        this.setMessage = setMessage;
        this.snake = new Snake({ x: 2, y: 2 });
    }

    public flush() {
        this.setField(this.field.toString());
    }

    public start() {
        this.field.clearField();
        this.setError(undefined);
        this.snake = new Snake({ x: getRandomInt(20, 80), y: getRandomInt(5, 15) });
        this.foodCount = 0;
        this.speed = 1;
        this.speedMs = 200;
        this.setScore({ food: this.foodCount, speed: 1 });
        this.spawnFood();
    }

    public move(m: Move) {
        let ok = false;
        switch (m) {
            case Move.right: {
                if (this.snakeDirection !== Move.left) {
                    ok = true;
                }
            } break;
            case Move.left: {
                if (this.snakeDirection !== Move.right) {
                    ok = true;
                }
            } break;
            case Move.up: {
                if (this.snakeDirection !== Move.down) {
                    ok = true;
                }
            } break;
            case Move.down: {
                if (this.snakeDirection !== Move.up) {
                    ok = true;
                }
            } break;
        }
        if (ok) {
            this.snakeDirection = m;
        }
    }

    public increaseFood() {
        this.foodCount += 1;
        let newSpeedMs = this.speedMs - 20;
        let addSpeed = true;
        if (newSpeedMs < 10) {
            newSpeedMs = 10;
            addSpeed = false;
        }
        this.speedMs = newSpeedMs;
        if (addSpeed) {
            this.speed += 1;
        }
        this.setScore({ food: this.foodCount, speed: this.speed });
        if (this.field.isFieldFull()) {
            this.setMessage("You win 😀");
        }
    }

    spawnFood() {
        while (true) {
            const coord: Coord = { x: getRandomInt(0, this.field.width), y: getRandomInt(0, this.field.height) };
            const ev = this.field.getValue(coord);
            if (ev === emptySymbol) {
                this.field.setValue(coord, foodSymbol);
                break;
            }
        }
    }

    draw() {
        try {
            const mm = this.snakeDirection;
            let moveX = 0;
            let moveY = 0;
            switch (mm) {
                case Move.up: {
                    moveY = -1;
                } break;
                case Move.down: {
                    moveY = 1;
                } break;
                case Move.left: {
                    moveX = -1;
                } break;
                case Move.right: {
                    moveX = 1;
                } break;
            }
            this.snake.move({ x: moveX, y: moveY }, this);

            this.setField(this.field.toString());
        } catch (error: any) {
            this.setError(error.message);
        }
    }

    public stop() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
    }
}