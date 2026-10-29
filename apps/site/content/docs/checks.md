# Before it goes

`problemsOf(email)` says what an email lacks before it is sent: each problem a code for your application, and `describeProblem` puts it in words, in English or Spanish. The editor shows them in its panel and `useMail().problems` gives them.

```ts
import { describeProblem, problemsOf } from '@rebomail/core';

const problems = problemsOf(email, { variables: ['name', 'company'] });
if (problems.length) throw new Error(problems.map((p) => describeProblem(p, 'en')).join('\n'));
```

<demo name="checks" />

## The problems

| Code | When | With |
| --- | --- | --- |
| `no-subject` | The subject is empty. | |
| `no-blocks` | There is nothing in the email. | |
| `incomplete` | A block lacks what it needs to show anything: a picture without its address, a button without words or a link, a heading without words. | `block`, `type` |
| `empty-layout` | A section, or a column of a row, holds nothing. | `block`, `type`, `column` |
| `bad-link` | A link goes where no inbox follows: `javascript:`, a word that is not an address. | `block`, `type`, `url` |
| `unknown-variable` | A variable is used that the application does not fill. Only when `variables` is given. | `name` |

`block` is the id of the block, so the editor, or your interface, can choose it: `select(problem.block)`.

## Options

| Option | What it is |
| --- | --- |
| `variables` | The names your application fills. Without them, no variable is a problem. |
| `custom` | The renderers of your own blocks: a block whose `complete` says `false` is `incomplete`. |

## Whether a block is complete

`isComplete(block, custom)` is the check of `incomplete` for one block: what the editor uses to show a block that still lacks something.
