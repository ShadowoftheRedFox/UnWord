import { ChangeDetectorRef, Component, inject, Input, OnInit } from "@angular/core";
import { Engine } from "../../../../services/engine";

@Component({
    selector: "app-case",
    imports: [],
    templateUrl: "./case.html",
    styleUrl: "./case.css",
})
export class Case implements OnInit {
    @Input() active = false;
    @Input({ required: true }) revealed = false;
    @Input({ required: true }) position = -1;
    @Input({ required: true }) line = -1;
    @Input({
        transform: (v: string | undefined) => {
            return v !== undefined && v.length > 0 ? v[0] : " ";
        },
    })
    guess = " ";

    constructor(
        private engine: Engine,
        private ref: ChangeDetectorRef,
    ) {
        this.engine.wordUpdate.subscribe(() => {
            this.reset();
            this.ready();
        });
    }

    ngOnInit(): void {
        this.ready();
    }

    private reset() {
        this.active = false;
        this.revealed = false;
        this.guess = " ";
    }

    private ready() {
        this.engine.cases.set(this);
        if (
            this.engine.getGameRules().showNonAlphanumericCharacter &&
            /^[a-z]+$/i.test(this.engine.word[this.position])
        ) {
            this.reveal();
        }
    }

    public reveal() {
        this.revealed = true;
        this.ref.detectChanges();
    }

    public activate() {
        this.active = true;
        this.ref.detectChanges();
    }

    public caseClass = () => {
        const res = ["case"];

        if (this.revealed) {
            return res.join(" ");
        }

        res.push(this.active ? "active" : "inactive");

        if (this.guess == null) {
            res.push("empty");
        } else if (this.revealed) {
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
                    // TODO mark incorrect for the first one if unique
                    // yellow-orange
                    res.push(prefix + "incorrect");
                }
            } else {
                // grey color
                res.push("not-included");
            }
        }

        return res.join(" ");
    };
}
