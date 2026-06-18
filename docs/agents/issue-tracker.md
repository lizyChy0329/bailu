# Issue tracker: Local Markdown

Issues 和 PRDs 存在于 `.scratch/` 目录下的 markdown 文件中。

## Conventions

- 每个功能一个目录：`.scratch/<feature-slug>/`
- PRD 是 `.scratch/<feature-slug>/PRD.md`
- 实现 issue 是 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号
- Triage 状态记录在文件顶部附近的 `Status:` 行（参见 `triage-labels.md`）
- 评论和讨论追加到文件底部的 `## Comments` 标题下

## When a skill says "publish to the issue tracker"

在 `.scratch/<feature-slug>/` 下创建新文件（如果需要则先创建目录）。

## When a skill says "fetch the relevant ticket"

读取指定路径的文件。用户通常会直接传路径或 issue 编号。
