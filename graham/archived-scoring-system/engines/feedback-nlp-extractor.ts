/**
 * Feedback NLP Extractor
 * 
 * Extracts structured signals from free-text feedback using AI/NLP.
 * Based on Graham's actual decision-making criteria from the conversation.
 */

interface ExtractedSignals {
  // Overall sentiment
  overallSentiment: 'positive' | 'negative' | 'neutral'
  confidence: number // 0-1
  
  // Specific issues identified
  issuesIdentified: {
    factor: string
    issue: string
    userPreference?: string
    severity: 'low' | 'medium' | 'high'
  }[]
  
  // Positive signals mentioned
  positiveSignals: {
    category: string
    signal: string
    importance: 'low' | 'medium' | 'high'
  }[]
  
  // Corrections/preferences mentioned
  corrections: {
    category: string
    correctionType: 'overestimated' | 'underestimated' | 'wrong_category' | 'missing_info'
    actualValue?: string
    preferredValue?: string
  }[]
  
  // Raw insights for learning
  rawInsights: string[]
}

interface FeedbackInput {
  isRelevant: boolean
  textFeedback: string
  prospectName?: string
  prospectRole?: string
  prospectCompany?: string
}

export class FeedbackNLPExtractor {
  
  /**
   * Extract signals from rich, detailed feedback using pattern matching and AI
   */
  public async extractSignals(input: FeedbackInput): Promise<ExtractedSignals> {
    const signals: ExtractedSignals = {
      overallSentiment: this.determineSentimentFromText(input.textFeedback), // Don't rely on isRelevant
      confidence: 0.6, // Higher confidence for rich text analysis
      issuesIdentified: [],
      positiveSignals: [],
      corrections: [],
      rawInsights: []
    }

    // Extract detailed patterns from rich feedback text
    this.extractDetailedPatterns(input, signals)
    
    // Extract linguistic and professional insights
    this.extractProfessionalInsights(input, signals)
    
    // Then, enhance with AI extraction (if available)
    if (process.env.OPENAI_API_KEY) {
      await this.enhanceWithAI(input, signals)
    }
    
    // Override isRelevant based on extracted sentiment
    input.isRelevant = signals.overallSentiment === 'positive'
    
    return signals
  }

  /**
   * Determine sentiment from the actual feedback text
   */
  private determineSentimentFromText(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase()
    
    // Strong negative indicators
    const strongNegative = /\b(avoid|skip|terrible|awful|fake|scam|waste|don't|shouldn't|not worth|red flag|horrible)\b/g
    const negativeMatches = (lowerText.match(strongNegative) || []).length
    
    // Strong positive indicators  
    const strongPositive = /\b(excellent|perfect|definitely|absolutely|outstanding|impressive|reach out|connect|valuable|quality|expert)\b/g
    const positiveMatches = (lowerText.match(strongPositive) || []).length
    
    // Contextual sentiment analysis
    const reachOutContext = /\b(reach out|connect|contact|worthwhile|good prospect|worth connecting)\b/g
    const skipContext = /\b(skip|avoid|pass|not interested|don't bother|waste of time)\b/g
    
    const reachOutScore = (lowerText.match(reachOutContext) || []).length
    const skipScore = (lowerText.match(skipContext) || []).length
    
    const totalPositive = positiveMatches + reachOutScore
    const totalNegative = negativeMatches + skipScore
    
    if (totalPositive > totalNegative) return 'positive'
    if (totalNegative > totalPositive) return 'negative'
    return 'neutral'
  }

  /**
   * Extract detailed patterns from rich feedback text
   */
  private extractDetailedPatterns(input: FeedbackInput, signals: ExtractedSignals) {
    const text = input.textFeedback.toLowerCase()
    
    // Content authenticity patterns (enhanced for detailed feedback)
    this.extractContentSignals(text, signals)
    
    // Network quality patterns
    this.extractNetworkSignals(text, signals)
    
    // Authority/expertise patterns
    this.extractAuthoritySignals(text, signals)
    
    // Linguistic analysis patterns
    this.extractLinguisticPatterns(text, signals)
    
    // Professional depth indicators
    this.extractProfessionalDepthSignals(text, signals)
    
    // Role/seniority corrections
    this.extractRoleCorrections(text, signals)
    
    // Company/industry corrections
    this.extractCompanyCorrections(text, signals)
    
    // General preference patterns
    this.extractPreferenceSignals(text, signals)
  }

  private extractContentSignals(text: string, signals: ExtractedSignals) {
    // Enhanced AI-generated content indicators
    const aiPatterns = [
      { pattern: /ai[\s\-]?generated|formulaic|template|sounds? like ai/gi, signal: 'ai_generated_content' },
      { pattern: /humble[\s\-]?brag|bragging|thrilled to (share|announce)/gi, signal: 'humble_bragging' },
      { pattern: /generic|cookie[\s\-]?cutter|copy[\s\-]?paste|surface[\s\-]?level/gi, signal: 'generic_content' },
      { pattern: /excited to share|game[\s\-]?chang(ing|er)|revolutionary|mind[\s\-]?blow(ing|n)/gi, signal: 'ai_buzzwords' },
      { pattern: /sentence structure|word choice|phrases like|classic ai patterns/gi, signal: 'linguistic_ai_detection' }
    ]
    
    // Enhanced authentic content indicators
    const authenticPatterns = [
      { pattern: /authentic|genuine|real|specific examples|actual experience/gi, signal: 'authentic_content' },
      { pattern: /storytelling|personal experience|lessons learned|went wrong/gi, signal: 'good_storytelling' },
      { pattern: /admits? mistakes?|failed|learned the hard way|messy details/gi, signal: 'honest_reflection' },
      { pattern: /conversational|includes (specific|actual) details|technical depth/gi, signal: 'authentic_communication' },
      { pattern: /been in the trenches|actually did|real experience/gi, signal: 'proven_experience' }
    ]
    
    // Enhanced influencer behavior indicators
    const influencerPatterns = [
      { pattern: /influencer|trying too hard|wannabe|self[\s\-]?promot/gi, signal: 'influencer_behavior' },
      { pattern: /motivational|lifestyle|guru|inspirational posts/gi, signal: 'lifestyle_content' },
      { pattern: /follow me|subscribe|check out my|thoughts\?|agree\?/gi, signal: 'self_promotion' }
    ]
    
    this.addPatternMatches(text, signals, aiPatterns, 'content_authenticity', 'negative')
    this.addPatternMatches(text, signals, authenticPatterns, 'content_authenticity', 'positive')  
    this.addPatternMatches(text, signals, influencerPatterns, 'influencer_behavior', 'negative')
  }

  private extractNetworkSignals(text: string, signals: ExtractedSignals) {
    const networkPatterns = [
      { pattern: /quality (people|network|connections)/, signal: 'quality_network' },
      { pattern: /connected to|mutual (connections|friends)/, signal: 'good_connections' },
      { pattern: /know (people|someone) (at|from|in)/, signal: 'warm_network' },
      { pattern: /influencer network|lifestyle network/, signal: 'bad_network' }
    ]
    
    this.addPatternMatches(text, signals, networkPatterns, 'network_quality', 'mixed')
  }

  private extractAuthoritySignals(text: string, signals: ExtractedSignals) {
    const authorityPatterns = [
      { pattern: /real expertise|genuine expert|knows what|technical depth|deep (understanding|knowledge)/gi, signal: 'real_expertise' },
      { pattern: /fake authority|claims don't match|overstat|doesn't align|inconsistent with/gi, signal: 'fake_authority' },
      { pattern: /experience (doesn't )?match|linkedin shows|actually (shows|indicates)/gi, signal: 'experience_mismatch' },
      { pattern: /specific (methodologies|examples|techniques)|references (actual|real)|mentions (specific|concrete)/gi, signal: 'specific_expertise' },
      { pattern: /explains complex|demonstrates understanding|shows they('ve| have)/gi, signal: 'demonstrated_knowledge' }
    ]
    
    this.addPatternMatches(text, signals, authorityPatterns, 'professional_authority', 'mixed')
  }

  private extractRoleCorrections(text: string, signals: ExtractedSignals) {
    // Seniority corrections
    const seniorityPatterns = [
      { pattern: /(only|just) (a |an )?(coordinator|assistant|junior)/, correction: 'overestimated_seniority' },
      { pattern: /(actually|really) (a )?(director|vp|senior)/, correction: 'underestimated_seniority' },
      { pattern: /not (a )?(director|manager|senior)/, correction: 'overestimated_seniority' }
    ]
    
    seniorityPatterns.forEach(({ pattern, correction }) => {
      if (pattern.test(text)) {
        signals.corrections.push({
          category: 'job_seniority',
          correctionType: correction.includes('over') ? 'overestimated' : 'underestimated',
          actualValue: this.extractValue(text, pattern),
          preferredValue: ''
        })
        signals.rawInsights.push(`Seniority correction: ${correction}`)
      }
    })
  }

  private extractCompanyCorrections(text: string, signals: ExtractedSignals) {
    const companyPatterns = [
      { pattern: /small company|startup|\d+[\s\-]?person company/, correction: 'company_too_small' },
      { pattern: /need enterprise|larger company|fortune/, correction: 'need_larger_company' },
      { pattern: /(wrong|different) industry/, correction: 'wrong_industry' }
    ]
    
    companyPatterns.forEach(({ pattern, correction }) => {
      if (pattern.test(text)) {
        signals.corrections.push({
          category: 'company_fit',
          correctionType: 'wrong_category',
          actualValue: this.extractValue(text, pattern),
          preferredValue: ''
        })
        signals.rawInsights.push(`Company correction: ${correction}`)
      }
    })
  }

  private extractPreferenceSignals(text: string, signals: ExtractedSignals) {
    // Extract user preferences mentioned in feedback
    const preferencePatterns = [
      { pattern: /i (need|want|prefer|look for|value|prioritize)/gi, signal: 'user_preference' },
      { pattern: /not interested in|don't want|avoid|stay away from/gi, signal: 'user_exclusion' },
      { pattern: /exactly what|perfect (match|fit)|ideal (candidate|prospect)/gi, signal: 'ideal_match' },
      { pattern: /(this is|these are) the (kind|type) of/gi, signal: 'preference_example' }
    ]
    
    this.addPatternMatches(text, signals, preferencePatterns, 'user_preferences', 'neutral')
  }

  /**
   * Extract linguistic patterns that indicate writing quality
   */
  private extractLinguisticPatterns(text: string, signals: ExtractedSignals) {
    const linguisticPatterns = [
      { pattern: /sentence structure|writing style|word choice|linguistic pattern/gi, signal: 'linguistic_analysis' },
      { pattern: /sounds like|reads like|feels like|comes across as/gi, signal: 'writing_assessment' },
      { pattern: /flow|structure|phrasing|terminology/gi, signal: 'writing_quality' },
      { pattern: /natural|conversational|flows well|well[\s\-]written/gi, signal: 'good_writing' },
      { pattern: /awkward|stilted|robotic|unnatural/gi, signal: 'poor_writing' }
    ]
    
    this.addPatternMatches(text, signals, linguisticPatterns, 'linguistic_analysis', 'neutral')
  }

  /**
   * Extract professional depth and expertise indicators
   */
  private extractProfessionalDepthSignals(text: string, signals: ExtractedSignals) {
    const depthPatterns = [
      { pattern: /industry knowledge|domain expertise|understands (the|our) (business|industry)/gi, signal: 'industry_knowledge' },
      { pattern: /specific examples|concrete cases|actual (numbers|data|results)/gi, signal: 'concrete_examples' },
      { pattern: /(mentions|references|talks about) (specific|actual|real) (tools|methods|processes)/gi, signal: 'technical_specificity' },
      { pattern: /depth of (knowledge|understanding|experience)|goes (deep|beyond surface)/gi, signal: 'knowledge_depth' },
      { pattern: /proven track record|demonstrable (results|experience)|quantifiable/gi, signal: 'proven_results' }
    ]
    
    this.addPatternMatches(text, signals, depthPatterns, 'professional_depth', 'positive')
  }

  /**
   * Extract professional insights from detailed feedback
   */
  private extractProfessionalInsights(input: FeedbackInput, signals: ExtractedSignals) {
    // Extract quoted examples or specific references
    const quotes = input.textFeedback.match(/['"`]([^'"`]+)['"`]/g) || []
    quotes.forEach(quote => {
      signals.rawInsights.push(`Quoted example: ${quote}`)
    })
    
    // Extract percentage/number mentions
    const numbers = input.textFeedback.match(/\d+%|\$\d+|\d+x|\d+ (years|months|people|companies)/gi) || []
    numbers.forEach(number => {
      signals.rawInsights.push(`Specific metric mentioned: ${number}`)
    })
    
    // Extract industry/role-specific terminology
    const industryTerms = input.textFeedback.match(/\b(saas|b2b|crm|mrr|arr|churn|cac|ltv|cohort|funnel|conversion|roi|kpi)\b/gi) || []
    if (industryTerms.length > 0) {
      signals.rawInsights.push(`Industry expertise shown: ${industryTerms.join(', ')}`)
      signals.positiveSignals.push({
        category: 'industry_expertise',
        signal: 'industry_terminology_usage',
        importance: 'high'
      })
    }
  }

  private addPatternMatches(
    text: string, 
    signals: ExtractedSignals, 
    patterns: Array<{pattern: RegExp, signal: string}>,
    category: string,
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  ) {
    patterns.forEach(({ pattern, signal }) => {
      if (pattern.test(text)) {
        if (sentiment === 'positive') {
          signals.positiveSignals.push({
            category,
            signal,
            importance: 'medium'
          })
        } else if (sentiment === 'negative') {
          signals.issuesIdentified.push({
            factor: category,
            issue: signal,
            severity: 'medium'
          })
        }
        signals.rawInsights.push(`${category}: ${signal}`)
      }
    })
  }

  private extractValue(text: string, pattern: RegExp): string {
    const match = text.match(pattern)
    return match ? match[0] : ''
  }

  /**
   * Enhance extraction using AI (OpenAI/Claude)
   */
  private async enhanceWithAI(input: FeedbackInput, signals: ExtractedSignals) {
    try {
      const prompt = this.buildAIPrompt(input)
      const aiResponse = await this.callAI(prompt)
      const aiSignals = this.parseAIResponse(aiResponse)
      
      // Merge AI signals with pattern-based signals
      this.mergeSignals(signals, aiSignals)
      signals.confidence = Math.min(0.9, signals.confidence + 0.3)
      
    } catch (error) {
      console.warn('AI enhancement failed, using pattern-based extraction only:', error)
      // Gracefully degrade to pattern-only extraction
    }
  }

  private buildAIPrompt(input: FeedbackInput): string {
    return `
Analyze this detailed LinkedIn prospect feedback and extract structured insights:

Rich Feedback: "${input.textFeedback}"
Prospect: ${input.prospectName || 'Unknown'} (${input.prospectRole || 'Unknown role'})

This is detailed professional feedback that may include:
- Linguistic analysis of writing patterns
- Assessment of content authenticity vs AI-generation
- Evaluation of professional expertise and authority
- Industry-specific knowledge indicators
- Specific examples, quotes, or metrics mentioned
- Pattern recognition for future prospect evaluation

Extract:

1. DETAILED ISSUES mentioned:
   - Content authenticity (AI patterns, linguistic indicators, writing style)
   - Professional authority (experience mismatches, fake expertise, credentials)
   - Industry knowledge depth (surface vs deep understanding)
   - Communication quality (writing style, authenticity markers)
   - Behavioral patterns (influencer tendencies, self-promotion)

2. POSITIVE INDICATORS identified:
   - Authentic expertise demonstrations
   - Industry-specific knowledge and terminology
   - Communication quality and style
   - Professional depth and experience
   - Specific examples or metrics mentioned

3. LEARNING PATTERNS for future prospects:
   - What linguistic patterns to look for/avoid
   - Industry expertise indicators valued by user
   - Content quality markers that matter
   - Professional credibility signals

4. SPECIFIC QUOTES or EXAMPLES mentioned in feedback

Return as JSON:
{
  "issues": [{"factor": "string", "issue": "string", "severity": "low|medium|high", "context": "string"}],
  "positives": [{"category": "string", "signal": "string", "importance": "low|medium|high", "context": "string"}],
  "learning_patterns": [{"pattern_type": "string", "pattern_description": "string", "importance": "string"}],
  "quoted_examples": ["string"],
  "key_insights": ["string"]
}
`
  }

  private async callAI(prompt: string): Promise<string> {
    // This would call OpenAI API or similar
    // For now, return empty response to avoid API calls during development
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No AI API key available')
    }
    
    // TODO: Implement actual AI API call
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [{ role: "user", content: prompt }],
    //   max_tokens: 500
    // })
    // return response.choices[0].message.content || ''
    
    return '' // Placeholder
  }

  private parseAIResponse(response: string): Partial<ExtractedSignals> {
    try {
      const parsed = JSON.parse(response)
      const insights = [...(parsed.key_insights || [])]
      
      // Add learning patterns to insights
      if (parsed.learning_patterns) {
        parsed.learning_patterns.forEach((pattern: any) => {
          insights.push(`Learning pattern: ${pattern.pattern_description}`)
        })
      }
      
      // Add quoted examples
      if (parsed.quoted_examples) {
        parsed.quoted_examples.forEach((quote: string) => {
          insights.push(`User referenced: ${quote}`)
        })
      }
      
      return {
        issuesIdentified: parsed.issues || [],
        positiveSignals: parsed.positives || [],
        rawInsights: insights
      }
    } catch (error) {
      console.warn('Failed to parse AI response:', error)
      return {}
    }
  }

  private mergeSignals(base: ExtractedSignals, ai: Partial<ExtractedSignals>) {
    if (ai.issuesIdentified) {
      // Merge unique issues
      const existingIssues = new Set(base.issuesIdentified.map(i => i.issue))
      ai.issuesIdentified.forEach(issue => {
        if (!existingIssues.has(issue.issue)) {
          base.issuesIdentified.push(issue)
        }
      })
    }
    
    if (ai.positiveSignals) {
      // Merge unique positive signals
      const existingSignals = new Set(base.positiveSignals.map(s => s.signal))
      ai.positiveSignals.forEach(signal => {
        if (!existingSignals.has(signal.signal)) {
          base.positiveSignals.push(signal)
        }
      })
    }
    
    if (ai.rawInsights) {
      base.rawInsights.push(...ai.rawInsights)
    }
  }

  /**
   * Get a quick summary of extracted signals for learning
   */
  public summarizeSignals(signals: ExtractedSignals): {
    mainIssues: string[]
    mainPositives: string[]
    learningSignals: Array<{signal: string, weight: number}>
  } {
    const mainIssues = signals.issuesIdentified
      .filter(i => i.severity !== 'low')
      .map(i => i.issue)
    
    const mainPositives = signals.positiveSignals
      .filter(s => s.importance !== 'low') 
      .map(s => s.signal)
    
    // Convert to learning signals with weights
    const learningSignals: Array<{signal: string, weight: number}> = []
    
    signals.issuesIdentified.forEach(issue => {
      learningSignals.push({
        signal: issue.issue,
        weight: signals.overallSentiment === 'negative' ? -0.8 : -0.3
      })
    })
    
    signals.positiveSignals.forEach(positive => {
      learningSignals.push({
        signal: positive.signal,
        weight: signals.overallSentiment === 'positive' ? 0.8 : 0.3
      })
    })
    
    return { mainIssues, mainPositives, learningSignals }
  }
}

export const feedbackNLPExtractor = new FeedbackNLPExtractor()