import { Component, inject } from '@angular/core';
import { Engine } from '../../../services/engine';
import { prefilledArray } from '../../../shared/utils';
import { Case } from './case/case';

@Component({
    selector: 'app-game-board',
    imports: [
        Case
    ],
    templateUrl: './board.html',
    styleUrl: './board.css',
})
export class Board {
    private readonly engine = inject(Engine);
    private word = "";
    private numberOfTries = 6;

    constructor() {
        this.engine.wordUpdate.subscribe(() => {
            this.word = this.engine.word;
        });
    }

    public get tries(): number[] {
        return prefilledArray(this.numberOfTries);
    }

    public get wordLength(): number[] {
        return prefilledArray(this.word.length);
    }
}
