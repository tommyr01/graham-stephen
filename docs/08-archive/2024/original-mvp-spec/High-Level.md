MVP: LinkedIn Comment Research Tool
Goal
Save User time by automatically pulling all commenters on a given LinkedIn post, analyzing their recent posts for relevance to his target topics, and showing a quick relevance score with the option to give feedback.

Core User Flow
Input:
User copies a LinkedIn post URL → pastes it into a single input field → clicks Fetch Comments.

Comments Retrieval:
App calls post_comments_replies_stats API → returns:

Comment text

Author name, profile pic, headline, profile URL

Basic engagement stats (likes, replies)

Display Comments:
Each comment appears in a card with:

Author details

Comment text

"Research" button

Research Mode (on click):

Pulls author’s recent posts (up to 100 if API allows)

Scores each post using:

Boost terms (relevant topics)

Down terms (off-topic topics)

Simple weighted scoring system

Returns:

Overall relevance score (0–10)

Key matched terms

Scrollable feed of author’s posts

Feedback Loop:
In the expanded research card, User can type:

“Relevant” or “Not relevant” (or any notes)

Feedback gets saved to a small DB (or Airtable) to refine scoring terms later.

MVP Features
Frontend

Simple web UI (React or Next.js)

I want there to be a dark and light toggle to change to black/dark grey or white

Input field + button

List of comments with profile info

Expandable card for research results

Feedback text field

Backend

API calls to LinkedIn post_comments_replies_stats + (author recent posts API if available)

Lightweight scoring engine (keyword matching + weights)

Store feedback in Airtable or small Postgres DB

AI

Phase 1: Keyword-based scoring

Phase 2 (optional upgrade): LLM-powered context analysis for nuance

Data Store

Store User's feedback & raw post text for retraining

Okay, so this is what I'm thinking, right? Just as like a quick thing, this is an unpaid thing that we're trying to create for this dude, just as like a test to see if, you know, we can create something that's gonna save him time, so give him value. So here's what I'm thinking. He was talking about, he sees people's posts, and then he'll look through all the people that comment on that post to see if there's any like, relevant people to reach out to. So here's what I'm thinking. We can create a, just a simple like, application build that is like, he can, when he's searching through LinkedIn, he can copy the URL of the post and he can put that into a box, right? So just like a field on the application page. And then it can be like, he'll press a button and then the post will come up with all of the comments of that post. And then what I want to have is, in the comments section, we have all the data of the people that have posted, you know, name, image, comment, and then on these, either... Okay, so on these, on the post, there's a, on the comments, sorry, there's a button that's like, research. So then I can press that research button. And what happens is in the background, no, so, okay, so what happens is a expand screen card comes up. So it expands into a larger card where it's done research on this profile. It's looked at their, you know, their recent posts, which I think it pulls up the last hundred posts, okay? So what it does is it pulls up all those hundred posts and then it analyzes them. But what I want it to do is to basically go through like an agentic flow where it will analyze each of the posts for the things that he's looking for, right? And then it brings back a research report. So that can be like a scoring thing, you know? And then what I want to do is I want to have a field in that expanded card that is like feedback. So it's like him to give feedback. So I want all the posts to be displayed there, maybe in like a scrollable field. So you can just like scroll through all of their posts. There's the review insights section on the left, the posts on the scrollable posts thing on the right of the page. And then there's a feedback field that he can type into and then give feedback to the agentic workflow, right? So it's an AI intelligent agent that we can give feedback to that's going to improve every time it does it from the feedback, you know? So I don't know what this needs to entail, like if this is going to entail a rag system or whatever the stack needs to be that we can create something like this