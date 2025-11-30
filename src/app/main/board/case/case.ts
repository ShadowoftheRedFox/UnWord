import { Component, computed, inject, Input } from '@angular/core';
import { Engine } from '../../../../services/engine';

@Component({
    selector: 'app-case',
    imports: [],
    templateUrl: './case.html',
    styleUrl: './case.css',
})
export class Case {
    @Input() active = false;
    @Input({ required: true }) reaveal = false;
    @Input({ required: true, transform: (v: string) => { return v.length > 0 ? v[0] : " "; } }) guess = " ";
    @Input({ required: true }) position = -1;

    private readonly engine = inject(Engine);

    public caseClass = computed<string>(() => {
        const res = ["case"];

        res.push(this.active ? "active" : "inactive");

        if (this.guess == null) {
            res.push("empty");
        } else if (this.reaveal) {
            const w = this.engine.word;
            // compare the guess to the word
            if (w.includes(this.guess)) {
                const guessPos = w.indexOf(this.guess);
                // when multiple, the background has a pruple border indicating multiple
                // unique is with a seamless border
                const prefix = guessPos != w.lastIndexOf(this.guess) ? "multiple-" : "unique-";

                if (guessPos == this.position) {
                    // green
                    res.push(prefix + "correct");
                } else {
                    // yellow-orange
                    res.push(prefix + "incorrect");
                }
            } else {
                // grey color
                res.push("not-included");
            }
        }

        return res.join(" ");
    });
}
