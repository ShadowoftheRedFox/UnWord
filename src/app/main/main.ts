import { Component, inject } from '@angular/core';
import { Engine } from '../../services/engine';

@Component({
    selector: 'app-main',
    imports: [],
    templateUrl: './main.html',
    styleUrl: './main.css',
})
export class Main {
    private readonly engine = inject(Engine);
    public word = "";

    constructor() {
        this.engine.wordUpdate.subscribe((id) => {
            this.word = this.engine.word
            console.log(id);
        });
    }

    public next() {
        this.engine.nextWord();
    }
}
