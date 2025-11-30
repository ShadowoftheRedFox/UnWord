import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { clamp, randomInt } from '../shared/utils';
import { Guess } from '../models/guess';

@Injectable({
    providedIn: 'root',
})
export class Engine {
    /** Used to make http requests. */
    private readonly http = inject(HttpClient);
    /** Current document, do access local storage. */
    private readonly document = inject(DOCUMENT);

    /** Key to save the word index. */
    private readonly LOCAL_INDEX = "choosenWordIndex" as const;
    /** Key to save played date. */
    private readonly LOCAL_DATE = "choosenWordDate" as const;
    /** Ratio from ms time to day time. */
    private readonly MS_DAY_RATIO = 1000 * 3600 * 24;
    /** The value of how different the next word index must be. */
    private readonly NEXT_RND_INDEX = 300;

    /** Currently choosen word index. -1 is unset. */
    private choosenWordIndex = -1;
    /** Currently chossen word. empty is unset. */
    private choosenWord = "";
    /** Current date of the game. */
    private choosenDate = this.getTodayDay();

    /** Obervable to send update when the word changes. */
    public wordUpdate = new Subject<number>();

    /** Set of character composing the alphabet. */
    private alphabet = new Set<string>();
    /** List of current guess for each alphabet character. */
    public guesses: Map<string, Guess> = new Map<string, Guess>();

    constructor() {
        // we must be able to access localstorage to save progress
        if (this.localStorage === undefined) return;

        // function to run when updating the word
        this.wordUpdate.subscribe(() => {
            this.resetGuesses();
            this.updateLocalStorage();
        });

        /** Running a new word, or set the progress back. */
        this.choosenWordIndex = Number(this.localStorage.getItem(this.LOCAL_INDEX) || -1);
        const localDate = Number(this.localStorage.getItem(this.LOCAL_DATE) || this.choosenDate);
        this.getWords((words) => {
            // get alphabet from the dictionary
            words.forEach(w => {
                w.split("").forEach(l => {
                    this.alphabet.add(l.toLowerCase());
                });
            });

            // update daily word
            if (this.choosenWordIndex === -1 || this.choosenDate != localDate) {
                this.choosenWordIndex = randomInt(words.length);
                this.choosenWord = words[this.choosenWordIndex];
                this.wordUpdate.next(this.choosenWordIndex);
            } else {
                // set progress back
                this.choosenWord = words[this.choosenWordIndex];
                this.wordUpdate.next(this.choosenWordIndex);
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

        this.localStorage.setItem(this.LOCAL_INDEX, this.choosenWordIndex + "");
        this.localStorage.setItem(this.LOCAL_DATE, this.getTodayDay() + "");
    }

    /**
     * Fetch the dictionarry, and run the call back function with the list of words.
     * @param callback A function to run when words have been fetched. Won't be called if the fetch fails.
     */
    private getWords(callback: (words: string[]) => unknown): void {
        // get dictionnary
        this.http.get("/dictionary/french.csv", {
            headers: new HttpHeaders({}),
            responseType: 'text'
        }).subscribe({
            next: (res) => {
                const words = res.split("\n");
                callback(words);
            },
            error: () => {
                console.error("Could not get API list of words");
            }
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
            const minIndex = clamp(this.choosenWordIndex - this.NEXT_RND_INDEX, 0, length);
            const maxIndex = clamp(this.choosenWordIndex + this.NEXT_RND_INDEX, 0, length);

            let nextWordIndex = this.choosenWordIndex;

            while (minIndex <= nextWordIndex && nextWordIndex <= maxIndex) {
                nextWordIndex = randomInt(words.length);
            }

            // update everything and send the updates
            this.choosenWordIndex = nextWordIndex;
            this.choosenWord = words[this.choosenWordIndex];
            this.wordUpdate.next(this.choosenWordIndex);
        });
    }

    /**
     * Get the date, as the number of days passed since EPOCH.
     * @returns The amount of day since midnight, January 1st 1970 UTC.
     */
    private getTodayDay(): number {
        return Math.floor(new Date().getTime() / this.MS_DAY_RATIO);
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
}
