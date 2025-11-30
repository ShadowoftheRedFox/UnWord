import { Component, inject } from '@angular/core';
import { Engine } from '../../services/engine';
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { Board } from "./board/board";

@Component({
    selector: 'app-menu-main',
    imports: [
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule,
        Board
    ],
    templateUrl: './main.html',
    styleUrl: './main.css',
})
export class Main {
    private readonly engine = inject(Engine);
    public word = "";

    constructor() {
        this.engine.wordUpdate.subscribe(() => {
            this.word = this.engine.word
        });
    }

    public next() {
        this.engine.nextWord();
    }
}
