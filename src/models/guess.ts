export interface Guess {
    /**
     * Character guessed.
     */
    character: string,
    /**
     * The position of the character in the guess.
     * You can also check if it has multiple possibility by testing it's length.
     * You can also check if it is included in teh word by checking if it's empty.
     */
    position: number[],
    /**
     * If one of the position is right.
     */
    right: boolean,
    /**
     * Whether this character has already been guessed.
     */
    guessed: boolean
}
