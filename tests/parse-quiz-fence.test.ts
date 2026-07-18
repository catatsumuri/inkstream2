import assert from 'node:assert/strict';
import test from 'node:test';
import { parseQuizFence } from '../src/parse-quiz-fence.js';

test('parses a well-formed quiz', () => {
    const quiz = parseQuizFence(
        'question: 1 + 1 は?\nA: 1\nB: 2\nC: 3\ncorrect: B\nhint: 指を折って数えてみましょう\nexplanation: 1に1を足すと2です',
    );

    assert.deepEqual(quiz, {
        question: '1 + 1 は?',
        correct: 'B',
        options: [
            { label: 'A', text: '1' },
            { label: 'B', text: '2' },
            { label: 'C', text: '3' },
        ],
        hint: '指を折って数えてみましょう',
        incorrect: undefined,
        correctMessage: undefined,
        explanation: '1に1を足すと2です',
    });
});

test('folds a continuation line into the preceding option or field', () => {
    const quiz = parseQuizFence(
        'question: 長い質問文が\n複数行にわたる場合は?\nA: 選択肢1\nB: 選択肢2\ncorrect: A',
    );

    assert.equal(quiz?.question, '長い質問文が 複数行にわたる場合は?');
});

test('rejects a quiz with fewer than two options', () => {
    assert.equal(
        parseQuizFence('question: 質問\nA: 1つだけ\ncorrect: A'),
        null,
    );
});

test('rejects a quiz whose correct label names no option', () => {
    assert.equal(
        parseQuizFence('question: 質問\nA: 1\nB: 2\ncorrect: C'),
        null,
    );
});

test('rejects a quiz missing question or correct', () => {
    assert.equal(parseQuizFence('A: 1\nB: 2\ncorrect: A'), null);
    assert.equal(parseQuizFence('question: 質問\nA: 1\nB: 2'), null);
});
