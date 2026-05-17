import { Component, HostListener, inject } from "@angular/core";
import { Engine } from "../../../services/engine";
import { prefilledArray } from "../../../shared/utils";
import { Case } from "./case/case";

@Component({
    selector: "app-game-board",
    imports: [Case],
    templateUrl: "./board.html",
    styleUrl: "./board.css",
})
export class Board {
    private readonly engine = inject(Engine);

    private word = "";
    private guessses: string[] = [];
    // TODO refactor lul
    private guessMade = 0;
    private guessPosition = 0;

    constructor() {
        this.reset();

        this.engine.wordUpdate.subscribe(() => {
            this.reset();
            this.word = this.engine.word;
        });

        this.engine.gameReady.subscribe(() => {
            this.engine.cases.activateLine(0);
        });
    }

    private reset() {
        this.guessMade = 0;
        this.guessPosition = 0;
        this.guessses = new Array<string>(this.engine.getGameRules().maxTries).fill("");
    }

    public get tries(): number[] {
        return prefilledArray(this.engine.getGameRules().maxTries);
    }

    public get wordLength(): number[] {
        return prefilledArray(this.word.length);
    }

    public casesGuesses(line: number, position: number): string {
        if (this.guessses.length - 1 < line || this.guessses[line].length - 1 < position)
            return " ";
        return this.guessses[line][position] || " ";
    }

    @HostListener("window:keyup", ["$event"])
    onKeyUp(event: KeyboardEvent) {
        if (this.guessMade >= this.engine.getGameRules().maxTries) {
            return;
        }

        const key = event.key.toLowerCase();
        if (
            key === "delete" ||
            key == "backspace" ||
            (key === "eraseeof" && this.guessPosition > 0)
        ) {
            this.guessses[this.guessMade] = this.guessses[this.guessMade].substring(
                0,
                this.guessPosition - 1,
            );
            this.guessPosition--;
            event.preventDefault();
        } else if (key === "enter") {
            if (this.guessPosition === this.word.length) {
                // send reveal update and check if correct
                this.engine.cases.revealLine(this.guessMade);
                this.guessMade++;
                this.guessPosition = 0;
                this.engine.cases.activateLine(this.guessMade);
                event.preventDefault();
            }
        } else if (
            this.guessPosition < this.word.length &&
            key.length === 1 &&
            this.engine.alphabet.has(key.toLowerCase())
        ) {
            this.guessses[this.guessMade] = this.guessses[this.guessMade] + key;
            this.guessPosition++;
            event.preventDefault();
        }
    }
}
