import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Engine } from "../../services/engine";
import { MatIconModule } from "@angular/material/icon";
import { MatInput, MatLabel } from "@angular/material/input";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatError, MatFormField } from "@angular/material/form-field";
import { MatMenuModule } from "@angular/material/menu";
import { MatExpansionModule } from "@angular/material/expansion";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";

@Component({
    selector: "app-settings",
    imports: [
        MatIconModule,
        MatInput,
        MatCheckbox,
        MatFormField,
        MatLabel,
        MatMenuModule,
        MatExpansionModule,
        ReactiveFormsModule,
        MatError,
    ],
    templateUrl: "./settings.html",
    styleUrl: "./settings.css",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
    readonly CONST = {
        MIN_LENGTH: 3,
    };

    minLength = new FormControl<number>(4, [
        Validators.required,
        Validators.min(this.CONST.MIN_LENGTH),
    ]);
    maxLength = new FormControl<number>(8, [
        Validators.required,
        Validators.min(this.CONST.MIN_LENGTH),
    ]);
    maxTries = new FormControl<number>(6, [
        Validators.required,
        Validators.min(this.CONST.MIN_LENGTH),
    ]);
    showSpecial = true;
    replaceSpecial = true;

    constructor(private engine: Engine) {
        this.minLength.valueChanges.subscribe((value) => {
            if (value == null || value < this.CONST.MIN_LENGTH) return;
            engine.setGameRules("minLength", value);
        });
        this.maxLength.valueChanges.subscribe((value) => {
            if (value == null || value < this.CONST.MIN_LENGTH) return;
            engine.setGameRules("maxLength", value);
        });
        this.maxTries.valueChanges.subscribe((value) => {
            if (value == null || value < this.CONST.MIN_LENGTH) return;
            engine.setGameRules("maxTries", value);
        });
    }

    changeShowSpecial(value: boolean) {
        this.showSpecial = value;
        this.engine.setGameRules("showNonAlphanumericCharacter", value);
    }

    replaceShowSpecial(value: boolean) {
        this.replaceSpecial = value;
        this.engine.setGameRules("normalizeAccents", value);
    }
}
