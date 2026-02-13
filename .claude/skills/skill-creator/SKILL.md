---
name: skill-creator
description: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.
---

# Skill Creator

This skill provides guidance for creating effective skills.

## About Skills

Skills are modular, self-contained packages that extend Claude's capabilities by providing specialized knowledge, workflows, and tools.

### What Skills Provide

1. Specialized workflows - Multi-step procedures for specific domains
2. Tool integrations - Instructions for working with specific file formats or APIs
3. Domain expertise - Company-specific knowledge, schemas, business logic
4. Bundled resources - Scripts, references, and assets for complex and repetitive tasks

## Core Principles

### Concise is Key

The context window is a public good. Only add context Claude doesn't already have. Challenge each piece of information: "Does Claude really need this explanation?" and "Does this paragraph justify its token cost?"

### Set Appropriate Degrees of Freedom

**High freedom**: Use when multiple approaches are valid.
**Medium freedom**: Use when a preferred pattern exists with some variation.
**Low freedom**: Use when operations are fragile and consistency is critical.

### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/      - Executable code
    ├── references/   - Documentation loaded as needed
    └── assets/       - Files used in output (templates, etc.)
```

#### SKILL.md Frontmatter

- **name** (required): Skill identifier (lowercase, hyphens)
- **description** (required): What the skill does and when to use it. This is the triggering mechanism.

#### Bundled Resources

- **Scripts**: For deterministic, repeatedly-written code. Token efficient, may execute without loading into context.
- **References**: Documentation loaded as needed. Keeps SKILL.md lean.
- **Assets**: Output resources (templates, images) not loaded into context.

### Progressive Disclosure

1. **Metadata** - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (<5k words)
3. **Bundled resources** - As needed

Keep SKILL.md under 500 lines. Split content into separate files when approaching this limit. Reference split files clearly from SKILL.md.

## Skill Creation Process

1. **Understand** the skill with concrete examples
2. **Plan** reusable contents (scripts, references, assets)
3. **Initialize** the skill directory structure
4. **Edit** — implement resources and write SKILL.md
5. **Iterate** based on real usage

### Writing Guidelines

- Use imperative/infinitive form
- Description must include both what the skill does AND when to trigger it
- Do NOT create auxiliary files (README.md, CHANGELOG.md, etc.)
- Only include files an AI agent needs to do the job
- Delete unused example directories
