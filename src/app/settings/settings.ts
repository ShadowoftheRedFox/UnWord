import { Component, inject } from '@angular/core';
import { Engine } from '../../services/engine';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatLabel } from "@angular/material/input"
import { MatCheckbox } from "@angular/material/checkbox"
import { MatFormField } from "@angular/material/form-field"
import { MatMenuModule } from "@angular/material/menu"

@Component({
    selector: 'app-settings',
    imports: [
        MatIconModule,
        MatInput,
        MatCheckbox,
        MatFormField,
        MatLabel,
        MatMenuModule
    ],
    templateUrl: './settings.html',
    styleUrl: './settings.css',
})
export class Settings {
    private readonly engine = inject(Engine);


}
