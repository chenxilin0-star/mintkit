import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ProductIdea {
  type: 'Planner' | 'Checklist' | 'Guide';
  title: string;
  targetUser: string;
  features: string[];
  pageCount: number;
}

export interface ProductContent {
  title: string;
  type: 'Planner' | 'Checklist' | 'Guide';
  content: string; // Markdown format
}

const ideaSystemPrompt = `You are a digital product generator. Generate exactly 5 digital product ideas for the given niche.
For each idea provide:
- type: "Planner", "Checklist", or "Guide"
- title: SEO-friendly English title (max 60 chars)
- targetUser: one sentence describing the target user
- features: array of 3-5 bullet points describing core functionality
- pageCount: recommended page count (5-20)

Output ONLY valid JSON array, no markdown, no explanation. Example:
[{"type":"Planner","title":"French Learning Weekly Planner","targetUser":"Adult learners studying French independently","features":["Weekly schedule grid","Vocabulary tracking section","Progress milestone tracker","Monthly review page"],"pageCount":12}]`;

export async function generateIdeas(niche: string): Promise<ProductIdea[]> {
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: ideaSystemPrompt },
      { role: 'user', content: `Generate 5 digital product ideas for niche: ${niche}` },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const text = completion.choices[0]?.message?.content || '[]';
  // Clean potential markdown code blocks
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

const contentSystemPrompt = `You are a professional digital product creator. Generate complete, actionable content for the selected digital product.

For PLANNER type, structure as:
# [Title]
## Cover Page
[Product name, tagline, target user]

## Table of Contents
[List of sections]

## Monthly/Weekly Overview
[Calendar grid or overview section]

## Weekly Pages (Week 1-4)
[Detailed weekly planning sections with spaces for tasks, goals, reflections]

## Monthly Review
[Reflection and progress tracking section]

For CHECKLIST type, structure as:
# [Title]
## Introduction
[What this checklist is for, who it's for]

## Category 1: [Category Name]
- [ ] [Checkbox item]
- [ ] [Checkbox item]

## Category 2: [Category Name]
- [ ] [Checkbox item]
- [ ] [Checkbox item]

[Additional categories as needed]

## Final Review / Summary
[Summary checklist]

For GUIDE type, structure as:
# [Title]
## Introduction
[What this guide covers, who it's for, what they'll achieve]

## Chapter 1: [Chapter Name]
[Content with actionable steps]

## Chapter 2: [Chapter Name]
[Content with actionable steps]

## Conclusion / Action Steps
[Summary and next steps]

IMPORTANT: 
- Write substantial, actionable content - not placeholder text
- Use proper Markdown formatting with ## for major sections, ### for subsections
- For checklists, use "- [ ]" format for checkboxes
- Content should be valuable and complete - a user should be able to print and use it immediately
- Total content should fill approximately the recommended page count
- Keep the content focused and practical`;

export async function generateProductContent(idea: ProductIdea): Promise<ProductContent> {
  const userPrompt = `Generate a complete ${idea.type} product for: ${idea.title}
Target user: ${idea.targetUser}
Core features to include: ${idea.features.join(', ')}
Recommended page count: ${idea.pageCount} pages

Output format: Markdown only, starting with # [Title]`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: contentSystemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = completion.choices[0]?.message?.content || '';

  return {
    title: idea.title,
    type: idea.type,
    content,
  };
}
