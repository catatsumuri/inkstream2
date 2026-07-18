export interface QuizOption {
    label: string;
    text: string;
}

export interface QuizContent {
    question: string;
    correct: string;
    options: QuizOption[];
    hint?: string;
    incorrect?: string;
    correctMessage?: string;
    explanation?: string;
}

type QuizFieldKey =
    | 'question'
    | 'hint'
    | 'incorrect'
    | 'correctMessage'
    | 'explanation';

/**
 * Parses a `question:` / `A: ...` / `correct:` style quiz fence into
 * structured content, or null if it's malformed (missing question/correct,
 * fewer than two options, or `correct` not naming a real option). Ported
 * from inkstream v1's `parseQuizContent`.
 */
export function parseQuizFence(content: string): QuizContent | null {
    const options: QuizOption[] = [];
    const fields: Partial<Record<QuizFieldKey, string>> & {
        correct?: string;
    } = {};
    let activeOption: QuizOption | null = null;
    let activeField: QuizFieldKey | null = null;

    for (const line of content.split('\n')) {
        const trimmed = line.trim();

        if (!trimmed) {
            activeOption = null;
            activeField = null;
            continue;
        }

        const optionMatch = /^(?<label>[A-Z]):\s*(?<text>.+)$/.exec(trimmed);

        if (optionMatch?.groups?.label && optionMatch.groups.text) {
            const option: QuizOption = {
                label: optionMatch.groups.label,
                text: optionMatch.groups.text.trim(),
            };

            options.push(option);
            activeOption = option;
            activeField = null;
            continue;
        }

        const fieldMatch =
            /^(?<key>question|correct|hint|incorrect|correctMessage|explanation):\s*(?<value>.+)$/.exec(
                trimmed,
            );

        if (fieldMatch?.groups?.key && fieldMatch.groups.value) {
            const key = fieldMatch.groups.key as QuizFieldKey | 'correct';
            const value = fieldMatch.groups.value.trim();

            if (key === 'correct') {
                fields.correct = value.toUpperCase();
                activeOption = null;
                activeField = null;
                continue;
            }

            fields[key] = value;
            activeOption = null;
            activeField = key;
            continue;
        }

        if (activeOption !== null) {
            activeOption.text += ` ${trimmed}`;
            continue;
        }

        if (activeField !== null) {
            fields[activeField] =
                `${fields[activeField] ?? ''} ${trimmed}`.trim();
            continue;
        }

        return null;
    }

    const question = fields.question?.trim();
    const correct = fields.correct?.trim().toUpperCase();

    if (!question || !correct || options.length < 2) {
        return null;
    }

    if (!options.some((option) => option.label === correct)) {
        return null;
    }

    return {
        question,
        correct,
        options,
        hint: fields.hint?.trim() || undefined,
        incorrect: fields.incorrect?.trim() || undefined,
        correctMessage: fields.correctMessage?.trim() || undefined,
        explanation: fields.explanation?.trim() || undefined,
    };
}
