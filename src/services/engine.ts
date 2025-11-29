import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { clamp, randomInt } from '../shared/utils';

@Injectable({
    providedIn: 'root',
})
export class Engine {
    private readonly http = inject(HttpClient);
    private readonly document = inject(DOCUMENT);

    private readonly LOCAL_INDEX = "choosenWordIndex" as const;
    private readonly LOCAL_DATE = "choosenWordDate" as const;
    private readonly MS_DAY_RATIO = 1000 * 3600 * 24;
    private readonly NEXT_RND_INDEX = 300;

    private choosenWordIndex = -1;
    private choosenWord = "";
    private choosenDate = this.getTodayDay();

    public wordUpdate = new Subject<number>();

    constructor() {
        if (this.localStorage === undefined) return;

        this.wordUpdate.subscribe(() => {
            this.updateLocalStorage();
        });

        this.choosenWordIndex = Number(this.localStorage.getItem(this.LOCAL_INDEX) || -1);
        const localDate = Number(this.localStorage.getItem(this.LOCAL_DATE) || this.choosenDate);
        if (this.choosenWordIndex === -1 || this.choosenDate != localDate) {
            this.getWords((words) => {
                this.choosenWordIndex = randomInt(words.length);
                this.choosenWord = words[this.choosenWordIndex];
                this.wordUpdate.next(this.choosenWordIndex);
            });
        } else {
            this.getWords((words) => {
                this.choosenWord = words[this.choosenWordIndex];
                this.wordUpdate.next(this.choosenWordIndex);
            });
        }
    }

    private updateLocalStorage() {
        if (this.localStorage === undefined) return;

        this.localStorage.setItem(this.LOCAL_INDEX, this.choosenWordIndex + "");
        this.localStorage.setItem(this.LOCAL_DATE, this.getTodayDay() + "");
    }

    private getWords(callback: (words: string[]) => unknown) {
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

    public nextWord() {
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

            this.choosenWordIndex = nextWordIndex;
            this.choosenWord = words[this.choosenWordIndex];
            this.wordUpdate.next(this.choosenWordIndex);
        });
    }

    private getTodayDay() {
        return Math.floor(new Date().getTime() / this.MS_DAY_RATIO);
    }

    private get localStorage() {
        return this.document.defaultView?.localStorage;
    }

    public get word() {
        return this.choosenWord;
    }
}
