import { HttpClient, HttpHeaders } from "@angular/common/http";
import { DOCUMENT, inject, Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { clamp, inbound, randomInt } from "../shared/utils";
import { Guess } from "../models/guess";
import { Case } from "../app/main/board/case/case";

export interface GameRules {
    /** Maximum number of tries per word. Default 6. */
    maxTries: number;
    /** Minimum length of the word. Default 4. Minimum 4. */
    minLength: number;
    /** Maximum length of the word. Default 50. Minimum 4. */
    maxLength: number;
    /** Whether or not to show in advance character that aren't alphanumerical, such as `'`, `-` or accents. */
    normalizeAccents: boolean;
    /** Whether or not to transform charcter with accent to it's basic form, such as `à` -> `a`. */
    showNonAlphanumericCharacter: boolean;
}

@Injectable({
    providedIn: "root",
})
export class Engine {
    /** Used to make http requests. */
    private readonly http = inject(HttpClient);
    /** Current document, do access local storage. */
    private readonly document = inject(DOCUMENT);

    private readonly CONSTANTS = {
        /** Key to save the word index. */
        LOCAL_INDEX: "choosenWordIndex",
        /** Key to save played date. */
        LOCAL_DATE: "choosenWordDate",
        /** Ratio from ms time to day time. */
        MS_DAY_RATIO: 1000 * 3600 * 24,
        /** The value of how different the next word index must be. */
        NEXT_RND_INDEX: 300,
    } as const;

    /** Currently choosen word index. -1 is unset. */
    private choosenWordIndex = -1;
    /** Currently chossen word. empty is unset. */
    private choosenWord = "";
    /** Current date of the game. */
    private choosenDate = this.getTodayDay();

    /** Obervable to send update when the word changes. */
    public wordUpdate = new Subject<{ index: number; word: string }>();
    /** Obervable to send update when the game rules change. */
    public gamerulesUpdate = new Subject<GameRules>();
    /** Obervable to send update when the game is ready to start. */
    public gameReady = new Subject<boolean>();

    /** Set of character composing the alphabet. */
    public readonly alphabet = new Set<string>();
    /** List of current guess for each alphabet character. */
    public guesses: Map<string, Guess> = new Map<string, Guess>();

    private gameCases: Map<number, Case> = new Map<number, Case>();

    /**
     * Manage cases for the game board.
     */
    public readonly cases = {
        /**
         * Add a case to the game board.
         * @param c The case to set.
         */
        set: (c: Case): void => {
            this.gameCases.set(c.line * this.word.length + c.position, c);
            if (this.cases.getAll().length == this.word.length * this.getGameRules().maxTries) {
                this.gameReady.next(true);
            }
        },
        /**
         * Get a specific case.
         * @param line Line of the case.
         * @param position Position in the line of the case.
         * @returns A case if one is at the wanted position, undefined otehrwise.
         */
        get: (line: number, position: number): Case | undefined => {
            if (
                line < 0 ||
                line >= this.getGameRules().maxTries ||
                position < 0 ||
                position >= this.word.length
            ) {
                return undefined;
            }
            return this.gameCases.get(line * this.word.length + position);
        },
        /**
         * Get all stored cases, sorted in order.
         * @returns All the game board cases.
         */
        getAll: (): Case[] => {
            return this.sortCases(Array.from(this.gameCases.values()));
        },
        /**
         * Get the array of cases on the given game board line.
         * @param line The line to filter from.
         * @returns The sorted cases on the given line.
         */
        getLine: (line: number): Case[] | undefined => {
            if (line < 0 || line >= this.getGameRules().maxTries) {
                return undefined;
            }
            return this.sortCases(
                Array.from(this.gameCases.values()).filter((a) => a.line === line),
            );
        },
        activateLine: (line: number): void => {
            const cases = this.cases.getLine(line);
            if (cases === undefined) {
                return;
            }

            cases.forEach((c) => {
                c.activate();
            });
        },
        revealLine: (line: number): void => {
            const cases = this.cases.getLine(line);
            if (cases === undefined) {
                return;
            }

            cases.forEach((c) => {
                c.reveal();
            });
        },
    };

    /**
     * Different rules for the game, that can be edited.
     * @see gamerulesUpdate
     */
    private gamerules: GameRules = {
        /** Maximum number of tries per word. */
        maxTries: 6,
        /** Minimum length of the word. */
        minLength: 4,
        /** Maximum length of the word. */
        maxLength: 8,
        /** Whether or not to show in advance character that aren't alphanumerical, such as `'`, `-` or accents. */
        showNonAlphanumericCharacter: false,
        /** Whether or not to transform charcter with accent to it's basic form, such as `à` -> `a`. */
        normalizeAccents: true,
    };

    constructor() {
        // we must be able to access localstorage to save progress
        if (this.localStorage === undefined) return;

        // function to run when updating the word
        this.wordUpdate.subscribe(() => {
            this.gameCases.clear();
            this.resetGuesses();
            this.updateLocalStorage();
            console.log(this.word);
        });

        /** Running a new word, or set the progress back. */
        this.choosenWordIndex = Number(this.localStorage.getItem(this.CONSTANTS.LOCAL_INDEX) || -1);
        const localDate = Number(
            this.localStorage.getItem(this.CONSTANTS.LOCAL_DATE) || this.choosenDate,
        );
        this.getWords((words) => {
            // get alphabet from the dictionary
            words.forEach((w) => {
                w.split("").forEach((l) => {
                    this.alphabet.add(l.toLowerCase());
                });
            });

            // update daily word
            if (this.choosenWordIndex === -1 || this.choosenDate != localDate) {
                this.nextWord();
            } else {
                // set progress back
                this.choosenWord = this.applyGamerules(words[this.choosenWordIndex]);
                this.wordUpdate.next({ index: this.choosenWordIndex, word: this.choosenWord });
            }
        });
    }

    /**
     * Save a new guess in local storage for this current date.
     * @param guess Character guessed.
     */
    public saveGuess(guess: string): void {
        // TODO save guess in local storage
        console.log("Not yet implemented 'saving guess " + guess + "'");
    }

    /**
     * Reset the guessses map.
     */
    private resetGuesses(): void {
        this.guesses.clear();
        this.alphabet.forEach((char) => {
            if (this.choosenWord.includes(char)) {
                const positions = this.allIndexOf(this.choosenWord, char);
                this.guesses.set(char, {
                    character: char,
                    guessed: false,
                    right: false,
                    position: positions,
                });
            } else {
                this.guesses.set(char, {
                    character: char,
                    guessed: false,
                    right: false,
                    position: [],
                });
            }
        });
    }

    /**
     * Gives a list of indexes where the researched char is. Can be empty is it is not included in the word.
     * @param word The word to find the indexes in.
     * @param searchChar Character to find the indexes of.
     * @returns A list of index where char is present in the word.
     */
    private allIndexOf(word: string, searchChar: string): number[] {
        const res: number[] = [];

        word.split("").forEach((c, i) => {
            if (c == searchChar) {
                res.push(i);
            }
        });

        return res;
    }

    /**
     * Save the choosen word of the day and the current date.
     */
    private updateLocalStorage(): void {
        if (this.localStorage === undefined) return;

        this.localStorage.setItem(this.CONSTANTS.LOCAL_INDEX, this.choosenWordIndex + "");
        this.localStorage.setItem(this.CONSTANTS.LOCAL_DATE, this.getTodayDay() + "");
    }

    /**
     * Fetch the dictionarry, and run the call back function with the list of words.
     * @param callback A function to run when words have been fetched. Won't be called if the fetch fails.
     */
    private getWords(callback: (words: string[]) => unknown): void {
        // get dictionary
        this.http
            .get(window.location.href + "dictionary/french.csv", {
                headers: new HttpHeaders({}),
                responseType: "text",
            })
            .subscribe({
                next: (res) => {
                    const words = res.split("\n");
                    callback(words);
                },
                error: () => {
                    console.error("Could not get API list of words");
                },
            });
    }

    /**
     * Choose a new word.
     */
    public nextWord(): void {
        this.getWords((words) => {
            // we want to have a different words, so far from the current one
            // since they are sorted alphabetically, we can just want an index
            // +- a number (we juste need to take into account the min and max index)

            const length = words.length - 1;
            const minIndex = clamp(
                this.choosenWordIndex - this.CONSTANTS.NEXT_RND_INDEX,
                0,
                length,
            );
            const maxIndex = clamp(
                this.choosenWordIndex + this.CONSTANTS.NEXT_RND_INDEX,
                0,
                length,
            );

            console.warn(this.choosenWordIndex);

            let nextWordIndex = randomInt(length);

            while (
                inbound(nextWordIndex, minIndex, maxIndex) ||
                words[nextWordIndex].length < this.getGameRules().minLength ||
                words[nextWordIndex].length > this.getGameRules().maxLength
            ) {
                nextWordIndex = randomInt(length);
            }

            // update everything and send the updates
            this.choosenWordIndex = nextWordIndex;
            this.choosenWord = this.applyGamerules(words[this.choosenWordIndex]);
            this.wordUpdate.next({ index: this.choosenWordIndex, word: this.choosenWord });
        });
    }

    /**
     * Apply the rules to the word, such as removing accents.
     * @param word The chosen word.
     * @returns The transformed word.
     */
    private applyGamerules(word: string): string {
        const gamerules = this.getGameRules();

        if (gamerules.normalizeAccents) {
            word = word.normalize("NFD").replace(/\p{Diacritic}/gu, "");
        }

        return word;
    }

    /**
     * Get the date, as the number of days passed since EPOCH.
     * @returns The amount of day since midnight, January 1st 1970 UTC.
     */
    private getTodayDay(): number {
        return Math.floor(new Date().getTime() / this.CONSTANTS.MS_DAY_RATIO);
    }

    /**
     * Sort the given array depending on the line and position of the cases.
     * @param arr An array of cases.
     * @returns The cases in the array, sorted.
     */
    private sortCases(arr: Case[]): Case[] {
        return arr.sort(
            (a, b) =>
                a.line * this.word.length + a.position - (b.line * this.word.length + b.position),
        );
    }

    /**
     * Get the local storage. Can be undefined if document has not yet loaded, or any other kind of errors.
     */
    private get localStorage(): Storage | undefined {
        return this.document.defaultView?.localStorage;
    }

    /**
     * Get the current word.
     */
    public get word() {
        return this.choosenWord;
    }

    /**
     * Get the game rules.
     */
    public getGameRules(): Readonly<GameRules> {
        return Object.freeze(structuredClone(this.gamerules));
    }

    /**
     * Change a rule of the game.
     * @param rule The rule to set.
     * @param value The value to set this specific rule to.
     * @returns True if the change has been made, false if the change has been ignored.
     */
    public setGameRules<R extends keyof GameRules>(rule: R, value: GameRules[R]): boolean {
        const vnum = value as number;
        let changes = false;

        switch (rule) {
            case "maxTries":
                if ((value as number) >= 1) {
                    this.gamerules.maxTries = value as number;
                    changes = true;
                }
                break;
            case "maxLength":
                if (vnum >= 4 && vnum >= this.gamerules.minLength) {
                    this.gamerules.maxTries = value as number;
                    changes = true;
                }
                break;
            case "minLength":
                if (vnum >= 4 && vnum <= this.gamerules.maxLength) {
                    this.gamerules.maxTries = value as number;
                    changes = true;
                }
                break;
            case "normalizeAccents":
                this.gamerules.normalizeAccents = value as boolean;
                changes = true;
                break;
            case "showNonAlphanumericCharacter":
                this.gamerules.showNonAlphanumericCharacter = value as boolean;
                changes = true;
                break;
        }

        if (changes) {
            this.gamerulesUpdate.next(this.getGameRules());
            this.nextWord();
        }

        return changes;
    }
}
