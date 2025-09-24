/**
 * AI service for natural language queries and intelligent suggestions
 */

import { logger } from '@/core/logger';
import { AI_CONFIG, getOpenRouterApiKey, getSiteUrl, getSiteName } from '@/config/ai-config';

export interface AIQuery {
  query: string;
  context?: string;
  type: 'analysis' | 'suggestion' | 'explanation' | 'refactor' | 'create' | 'read' | 'update' | 'delete' | 'search' | 'generate';
}

export interface AIResponse {
  answer: string;
  confidence: number;
  suggestions?: string[];
  relatedFiles?: string[];
  codeExamples?: CodeExample[];
}

export interface CodeExample {
  language: string;
  code: string;
  description: string;
}

export interface CRUDOperation {
  type: 'create' | 'read' | 'update' | 'delete';
  target: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface CodeGenerationRequest {
  type: 'function' | 'class' | 'component' | 'module' | 'test' | 'documentation';
  language: string;
  requirements: string;
  existingCode?: string;
  patterns?: string[];
}

export interface BulkAIRequest {
  operations: AIQuery[];
  batchSize?: number;
  maxConcurrency?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface IntelligentSuggestion {
  type: 'performance' | 'security' | 'maintainability' | 'architecture';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  codeExample?: string;
  relatedFiles: string[];
}

export class AIService {
  private static instance: AIService;
  private isEnabled: boolean = false;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Initialize AI service
   */
  public async initialize(): Promise<void> {
    try {
      // Check if AI service is available
      this.isEnabled = await this.checkAIServiceAvailability();
      
      if (this.isEnabled) {
        logger.info('AI service initialized successfully');
      } else {
        logger.warn('AI service not available - running in fallback mode');
      }
    } catch (error) {
      logger.error('Failed to initialize AI service', error as Error);
      this.isEnabled = false;
    }
  }

  /**
   * Process natural language query
   */
  public async processQuery(query: AIQuery): Promise<AIResponse> {
    if (!this.isEnabled) {
      return this.getFallbackResponse(query);
    }

    try {
      // Process AI query using real OpenRouter API
      const response = await this.processAIQuery(query);
      return response;
    } catch (error) {
      logger.error('AI query processing failed', error as Error);
      return this.getFallbackResponse(query);
    }
  }

  /**
   * Generate intelligent suggestions
   */
  public async generateSuggestions(
    codebase: any,
    context: string
  ): Promise<IntelligentSuggestion[]> {
    if (!this.isEnabled) {
      return this.getFallbackSuggestions(codebase, context);
    }

    try {
      const suggestions = await this.analyzeCodebaseIntelligence(codebase, context);
      return suggestions;
    } catch (error) {
      logger.error('AI suggestion generation failed', error as Error);
      return this.getFallbackSuggestions(codebase, context);
    }
  }

  /**
   * Explain code complexity
   */
  public async explainComplexity(
    code: string,
    metrics: any
  ): Promise<AIResponse> {
    const query: AIQuery = {
      query: `Analyze and explain this code's complexity and structure. Focus on what makes it complex or simple, and provide insights about its maintainability.`,
      context: `Code:\n\`\`\`\n${code}\n\`\`\`\n\nMetrics: Lines: ${metrics.lines}, Functions: ${metrics.functions}, Average Complexity: ${metrics.complexity}, Max Complexity: ${metrics.maxComplexity}, File Type: ${metrics.fileType}`,
      type: 'explanation'
    };

    return this.processQuery(query);
  }

  /**
   * Suggest refactoring
   */
  public async suggestRefactoring(
    code: string,
    issues: any[]
  ): Promise<AIResponse> {
    const issuesList = issues.map(i => `- ${i.title} (${i.severity}): ${i.description}`).join('\n');
    const query: AIQuery = {
      query: `Provide specific refactoring suggestions for this code. Focus on the identified issues and provide concrete improvements with code examples.`,
      context: `Code:\n\`\`\`\n${code}\n\`\`\`\n\nIssues Found:\n${issuesList}`,
      type: 'refactor'
    };

    return this.processQuery(query);
  }

  /**
   * Analyze security vulnerabilities
   */
  public async analyzeSecurity(
    code: string,
    vulnerabilities: any[]
  ): Promise<AIResponse> {
    const query: AIQuery = {
      query: `Analyze these security vulnerabilities and suggest fixes`,
      context: `Code: ${code}\nVulnerabilities: ${JSON.stringify(vulnerabilities)}`,
      type: 'analysis'
    };

    return this.processQuery(query);
  }

  /**
   * AI-powered code generation
   */
  public async generateCode(request: CodeGenerationRequest): Promise<AIResponse> {
    const query: AIQuery = {
      query: `Generate ${request.type} code in ${request.language} based on these requirements: ${request.requirements}`,
      context: `Language: ${request.language}\nType: ${request.type}\nExisting Code: ${request.existingCode || 'None'}\nPatterns: ${request.patterns?.join(', ') || 'Standard patterns'}`,
      type: 'generate'
    };

    return this.processQuery(query);
  }

  /**
   * AI-powered code search and discovery
   */
  public async searchCode(
    query: string,
    codebase: any,
    searchType: 'semantic' | 'pattern' | 'functionality' = 'semantic'
  ): Promise<AIResponse> {
    const aiQuery: AIQuery = {
      query: `Find code that ${query}. Search type: ${searchType}`,
      context: `Codebase: ${codebase.totalFiles} files, Languages: ${codebase.languages?.join(', ') || 'Unknown'}`,
      type: 'search'
    };

    return this.processQuery(aiQuery);
  }

  /**
   * AI-powered code reading and understanding
   */
  public async readCode(
    filePath: string,
    code: string,
    focusAreas?: string[]
  ): Promise<AIResponse> {
    const query: AIQuery = {
      query: `Analyze and explain this code. Focus on: ${focusAreas?.join(', ') || 'general understanding'}`,
      context: `File: ${filePath}\nCode:\n\`\`\`\n${code}\n\`\`\``,
      type: 'read'
    };

    return this.processQuery(query);
  }

  /**
   * AI-powered code updates and modifications
   */
  public async updateCode(
    originalCode: string,
    updateRequest: string,
    filePath: string
  ): Promise<AIResponse> {
    const query: AIQuery = {
      query: `Update this code: ${updateRequest}`,
      context: `File: ${filePath}\nOriginal Code:\n\`\`\`\n${originalCode}\n\`\`\``,
      type: 'update'
    };

    return this.processQuery(query);
  }

  /**
   * AI-powered code deletion recommendations
   */
  public async deleteCode(
    code: string,
    filePath: string,
    reason?: string
  ): Promise<AIResponse> {
    const query: AIQuery = {
      query: `Analyze if this code should be deleted. Reason: ${reason || 'General cleanup'}`,
      context: `File: ${filePath}\nCode:\n\`\`\`\n${code}\n\`\`\``,
      type: 'delete'
    };

    return this.processQuery(query);
  }

  /**
   * AI-powered code creation
   */
  public async createCode(
    specification: string,
    filePath: string,
    language: string,
    existingPatterns?: string[]
  ): Promise<AIResponse> {
    const query: AIQuery = {
      query: `Create code based on this specification: ${specification}`,
      context: `File: ${filePath}\nLanguage: ${language}\nExisting Patterns: ${existingPatterns?.join(', ') || 'None'}`,
      type: 'create'
    };

    return this.processQuery(query);
  }

  /**
   * Bulk AI processing for large codebases
   */
  public async processBulkOperations(
    request: BulkAIRequest
  ): Promise<AIResponse[]> {
    if (!this.isEnabled) {
      return request.operations.map(() => this.getFallbackResponse({
        query: 'Bulk operation',
        type: 'analysis'
      }));
    }

    const results: AIResponse[] = [];
    const batchSize = request.batchSize || 5;
    const maxConcurrency = request.maxConcurrency || 3;

    // Process operations in batches
    for (let i = 0; i < request.operations.length; i += batchSize) {
      const batch = request.operations.slice(i, i + batchSize);
      
      // Process batch with concurrency control
      const batchPromises = batch.map(async (operation, index) => {
        try {
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, index * 100));
          return await this.processQuery(operation);
        } catch (error) {
          logger.error(`Bulk operation failed for query: ${operation.query}`, error as Error);
          return this.getFallbackResponse(operation);
        }
      });

      // Wait for batch completion with concurrency limit
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push(this.getFallbackResponse({
            query: 'Failed operation',
            type: 'analysis'
          }));
        }
      });

      // Progress logging
      logger.debug(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(request.operations.length / batchSize)}`);
    }

    return results;
  }


  /**
   * Check if AI service is available
   */
  private async checkAIServiceAvailability(): Promise<boolean> {
    try {
      // Check if API key is available
      const apiKey = getOpenRouterApiKey();
      logger.debug('API key check:', { 
        hasKey: !!apiKey, 
        keyLength: apiKey?.length || 0,
        keyStart: apiKey?.substring(0, 10) || 'none'
      });
      
      if (!apiKey || apiKey === 'your-api-key-here') {
        logger.warn('OpenRouter API key not configured. AI service unavailable.');
        logger.info('Please configure your OpenRouter API key in the config.');
        return false;
      }

      // Skip network connectivity check and API test - just assume it's available
      // The actual API call will handle connectivity issues
      logger.debug('AI service availability check passed');
      return true;

    } catch (error) {
      logger.error('Failed to check AI service availability:', error as Error);
      return false;
    }
  }



  /**
   * Process AI query using OpenRouter API
   */
  private async processAIQuery(query: AIQuery): Promise<AIResponse> {
    try {
      const apiKey = getOpenRouterApiKey();
      const siteUrl = getSiteUrl();
      const siteName = getSiteName();

      logger.debug('Making OpenRouter API call:', {
        hasApiKey: !!apiKey,
        siteUrl,
        siteName,
        queryType: query.type
      });

      // Build the prompt based on query type
      const systemPrompt = this.buildSystemPrompt(query.type);
      const userPrompt = this.buildUserPrompt(query);

      // Use exactly the code snippet provided by the user
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": siteUrl,
          "X-Title": siteName,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-chat-v3.1:free",
          "messages": [
            {
              "role": "system",
              "content": systemPrompt
            },
            {
              "role": "user",
              "content": userPrompt
            }
          ]
        })
      });

      logger.debug('OpenRouter API response:', {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`OpenRouter API error: ${response.status} - ${errorText}`);
        return this.getFallbackResponse(query);
      }

      const data = await response.json() as any;
      const aiResponse = data.choices?.[0]?.message?.content;

      logger.debug('AI response received:', {
        hasResponse: !!aiResponse,
        responseLength: aiResponse?.length || 0
      });

      if (!aiResponse) {
        logger.error('No response from OpenRouter API');
        return this.getFallbackResponse(query);
      }

      // Parse the AI response into our format
      return this.parseAIResponse(aiResponse, query);

    } catch (error) {
      logger.error('OpenRouter API request failed:', error as Error);
      return this.getFallbackResponse(query);
    }
  }

  /**
   * Get predefined responses based on query type
   */
  private getPredefinedResponses(query: AIQuery): AIResponse {
    const queryLower = query.query.toLowerCase();

    if (query.type === 'analysis') {
      return {
        answer: this.getAnalysisResponse(queryLower),
        confidence: 0.85,
        suggestions: this.getAnalysisSuggestions(queryLower),
        relatedFiles: this.getRelatedFiles(queryLower),
        codeExamples: this.getCodeExamples(queryLower)
      };
    }

    if (query.type === 'suggestion') {
      return {
        answer: this.getSuggestionResponse(queryLower),
        confidence: 0.90,
        suggestions: this.getSuggestionSuggestions(queryLower),
        relatedFiles: this.getRelatedFiles(queryLower)
      };
    }

    if (query.type === 'explanation') {
      return {
        answer: this.getExplanationResponse(queryLower),
        confidence: 0.80,
        codeExamples: this.getCodeExamples(queryLower)
      };
    }

    if (query.type === 'refactor') {
      return {
        answer: this.getRefactorResponse(queryLower),
        confidence: 0.75,
        suggestions: this.getRefactorSuggestions(queryLower),
        codeExamples: this.getCodeExamples(queryLower)
      };
    }

    return this.getFallbackResponse(query);
  }

  /**
   * Get analysis response
   */
  private getAnalysisResponse(query: string): string {
    if (query.includes('performance')) {
      return "Based on the analysis, I've identified several performance bottlenecks. The main issues are inefficient database queries, lack of caching, and memory leaks in the event handlers. I recommend implementing query optimization, adding Redis caching, and fixing the memory leaks.";
    }
    
    if (query.includes('security')) {
      return "Security analysis reveals potential vulnerabilities including SQL injection risks, missing input validation, and exposed sensitive data. I suggest implementing parameterized queries, adding comprehensive input validation, and encrypting sensitive information.";
    }
    
    if (query.includes('maintainability')) {
      return "The codebase shows signs of technical debt with high cyclomatic complexity, duplicated code, and inconsistent naming conventions. Consider refactoring complex functions, extracting common utilities, and establishing coding standards.";
    }

    return "I've analyzed your codebase and found several areas for improvement. The main concerns are code complexity, performance optimization opportunities, and potential security issues. Would you like me to elaborate on any specific area?";
  }

  /**
   * Get suggestion response
   */
  private getSuggestionResponse(query: string): string {
    if (query.includes('optimize') || query.includes('performance')) {
      return "Here are my top performance optimization suggestions: 1) Implement lazy loading for components, 2) Add database query caching, 3) Optimize bundle size with code splitting, 4) Use memoization for expensive calculations.";
    }
    
    if (query.includes('refactor')) {
      return "Refactoring suggestions: 1) Extract complex functions into smaller, focused ones, 2) Create reusable utility functions, 3) Implement proper error handling patterns, 4) Add comprehensive type definitions.";
    }

    return "Based on your codebase analysis, I suggest focusing on code organization, performance optimization, and security improvements. Would you like specific recommendations for any particular area?";
  }

  /**
   * Get explanation response
   */
  private getExplanationResponse(query: string): string {
    if (query.includes('complexity')) {
      return "The high cyclomatic complexity in this code is caused by multiple nested conditions and loops. Each decision point (if, while, for, switch) increases complexity. To reduce it, consider extracting methods, using early returns, and simplifying conditional logic.";
    }
    
    if (query.includes('dependency')) {
      return "Circular dependencies occur when modules import each other directly or indirectly, creating a cycle. This makes the code harder to understand and test. Break the cycle by extracting shared functionality into a separate module or using dependency injection.";
    }

    return "I can explain various aspects of your code including complexity, dependencies, performance characteristics, and architectural patterns. What specific concept would you like me to clarify?";
  }

  /**
   * Get refactor response
   */
  private getRefactorResponse(query: string): string {
    return "Here's a refactoring plan for your code: 1) Extract the complex validation logic into a separate utility function, 2) Replace the nested if-else statements with a strategy pattern, 3) Add proper error handling with try-catch blocks, 4) Implement input validation using a schema validation library.";
  }

  /**
   * Get analysis suggestions
   */
  private getAnalysisSuggestions(query: string): string[] {
    return [
      "Run performance profiling to identify bottlenecks",
      "Conduct security audit with automated tools",
      "Review code complexity metrics and refactor high-complexity functions",
      "Analyze dependency graph for circular dependencies"
    ];
  }

  /**
   * Get suggestion suggestions
   */
  private getSuggestionSuggestions(query: string): string[] {
    return [
      "Consider using TypeScript for better type safety",
      "Implement automated testing with Jest or Vitest",
      "Add ESLint and Prettier for code quality",
      "Set up CI/CD pipeline for automated checks"
    ];
  }

  /**
   * Get refactor suggestions
   */
  private getRefactorSuggestions(query: string): string[] {
    return [
      "Extract complex functions into smaller, focused ones",
      "Replace magic numbers with named constants",
      "Use design patterns to improve code organization",
      "Add comprehensive error handling"
    ];
  }

  /**
   * Get related files
   */
  private getRelatedFiles(query: string): string[] {
    return [
      "src/utils/validation.ts",
      "src/services/api.ts",
      "src/components/Form.tsx"
    ];
  }

  /**
   * Get code examples
   */
  private getCodeExamples(query: string): CodeExample[] {
    return [
      {
        language: "typescript",
        code: "// Example: Optimized function\nconst processData = (data: Data[]) => {\n  return data\n    .filter(item => item.isValid)\n    .map(item => transformItem(item))\n    .reduce((acc, item) => acc + item.value, 0);\n};",
        description: "Optimized data processing with functional programming"
      },
      {
        language: "javascript",
        code: "// Example: Error handling\nasync function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    if (!response.ok) throw new Error(`HTTP ${response.status}`);\n    return await response.json();\n  } catch (error) {\n    console.error('Fetch failed:', error);\n    throw error;\n  }\n}",
        description: "Proper error handling with async/await"
      }
    ];
  }

  /**
   * Smart codebase analysis with AI insights
   */
  public async analyzeCodebaseIntelligence(
    codebase: any,
    context: string,
    deepAnalysis: boolean = false
  ): Promise<IntelligentSuggestion[]> {
    if (!this.isEnabled) {
      return this.getFallbackSuggestions(codebase, context);
    }

    try {
      const analysisType = deepAnalysis ? 'comprehensive deep analysis' : 'quick analysis';
      const query: AIQuery = {
        query: `Perform ${analysisType} of this codebase and provide intelligent suggestions for improvement. Focus on performance, security, maintainability, and architecture.`,
        context: `Codebase Analysis:\nTotal Files: ${codebase.totalFiles}\nLanguages: ${codebase.languages?.join(', ') || 'Unknown'}\nAverage Function Length: ${codebase.metrics?.averageFunctionLength || 'N/A'} lines\nAverage Complexity: ${codebase.metrics?.cyclomaticComplexity || 'N/A'}\nMax Nesting Depth: ${codebase.metrics?.nestingDepth || 'N/A'}\n\nContext: ${context}`,
        type: 'suggestion'
      };

      const response = await this.processQuery(query);
      
      // Parse AI response into structured suggestions
      return this.parseSuggestionsFromAI(response.answer, codebase);
    } catch (error) {
      logger.error('AI codebase analysis failed, using fallback suggestions', error as Error);
      return this.getFallbackSuggestions(codebase, context);
    }
  }

  /**
   * Parse AI response into structured suggestions
   */
  private parseSuggestionsFromAI(aiResponse: string, codebase: any): IntelligentSuggestion[] {
    const suggestions: IntelligentSuggestion[] = [];
    
    // Try to extract structured suggestions from AI response
    // This is a simplified parser - in a real implementation, you might want to use JSON format
    const lines = aiResponse.split('\n');
    let currentSuggestion: Partial<IntelligentSuggestion> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.match(/^\d+\./) || trimmed.startsWith('-')) {
        // Save previous suggestion if exists
        if (currentSuggestion.title) {
          suggestions.push({
            type: currentSuggestion.type || 'maintainability',
            priority: currentSuggestion.priority || 'medium',
            title: currentSuggestion.title,
            description: currentSuggestion.description || '',
            impact: currentSuggestion.impact || 'Improves code quality',
            effort: currentSuggestion.effort || 'medium',
            codeExample: currentSuggestion.codeExample || '',
            relatedFiles: currentSuggestion.relatedFiles || []
          });
        }
        
        // Start new suggestion
        currentSuggestion = {
          title: trimmed.replace(/^\d+\.\s*/, '').replace(/^-\s*/, ''),
          type: 'maintainability',
          priority: 'medium',
          effort: 'medium'
        };
      } else if (trimmed.toLowerCase().includes('performance')) {
        currentSuggestion.type = 'performance';
      } else if (trimmed.toLowerCase().includes('security')) {
        currentSuggestion.type = 'security';
        currentSuggestion.priority = 'high';
      } else if (trimmed.toLowerCase().includes('architecture')) {
        currentSuggestion.type = 'architecture';
      } else if (trimmed.toLowerCase().includes('high') || trimmed.toLowerCase().includes('critical')) {
        currentSuggestion.priority = 'high';
      } else if (trimmed.toLowerCase().includes('low')) {
        currentSuggestion.priority = 'low';
        currentSuggestion.effort = 'low';
      }
    }
    
    // Add the last suggestion
    if (currentSuggestion.title) {
      suggestions.push({
        type: currentSuggestion.type || 'maintainability',
        priority: currentSuggestion.priority || 'medium',
        title: currentSuggestion.title,
        description: currentSuggestion.description || '',
        impact: currentSuggestion.impact || 'Improves code quality',
        effort: currentSuggestion.effort || 'medium',
        codeExample: currentSuggestion.codeExample || '',
        relatedFiles: currentSuggestion.relatedFiles || []
      });
    }
    
    // If no structured suggestions found, create a general one
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'maintainability',
        priority: 'medium',
        title: 'AI Analysis Complete',
        description: aiResponse.substring(0, 200) + (aiResponse.length > 200 ? '...' : ''),
        impact: 'Provides insights for code improvement',
        effort: 'medium',
        relatedFiles: []
      });
    }
    
    return suggestions;
  }

  /**
   * Get fallback response when AI is not available
   */
  private getFallbackResponse(query: AIQuery): AIResponse {
    return {
      answer: "AI service is currently unavailable. Please check your configuration and try again.",
      confidence: 0.0,
      suggestions: [
        "Check your API configuration",
        "Verify network connectivity",
        "Try again in a few moments"
      ]
    };
  }

  /**
   * Get fallback suggestions when AI is not available
   */
  private getFallbackSuggestions(codebase: any, context: string): IntelligentSuggestion[] {
    return [
      {
        type: 'maintainability',
        priority: 'medium',
        title: 'Add Code Comments',
        description: 'Consider adding more documentation to improve code maintainability.',
        impact: 'Improves code readability',
        effort: 'low',
        relatedFiles: []
      }
    ];
  }

  /**
   * Build system prompt based on query type
   */
  private buildSystemPrompt(queryType: string): string {
    switch (queryType) {
      case 'analysis':
        return `You are an expert code analyst. Analyze the provided code and identify issues, patterns, and areas for improvement. Provide specific, actionable insights about code quality, performance, security, and maintainability.`;
      
      case 'suggestion':
        return `You are a senior software architect. Provide intelligent suggestions for improving the codebase. Focus on best practices, design patterns, and optimization opportunities.`;
      
      case 'explanation':
        return `You are a code educator. Explain complex code concepts in a clear, understandable way. Break down technical details and provide examples when helpful.`;
      
      case 'refactor':
        return `You are a refactoring expert. Suggest specific refactoring improvements with code examples. Focus on making code more readable, maintainable, and efficient.`;
      
      case 'create':
        return `You are an expert code generator. Create high-quality, production-ready code based on specifications. Follow best practices, include proper error handling, and ensure the code is well-documented and maintainable.`;
      
      case 'read':
        return `You are a code understanding expert. Analyze and explain code functionality, patterns, and purpose. Provide clear explanations of what the code does, how it works, and its role in the system.`;
      
      case 'update':
        return `You are a code modification expert. Update existing code while preserving functionality and improving quality. Ensure changes are backward compatible and follow established patterns.`;
      
      case 'delete':
        return `You are a code cleanup expert. Analyze whether code should be removed and provide recommendations. Consider dependencies, usage, and impact before suggesting deletion.`;
      
      case 'search':
        return `You are a code discovery expert. Help find relevant code based on semantic meaning, patterns, or functionality. Provide specific file locations and code snippets that match the search criteria.`;
      
      case 'generate':
        return `You are an expert code generator. Generate complete, functional code based on requirements. Include proper structure, error handling, documentation, and follow language-specific best practices.`;
      
      default:
        return `You are an expert software developer and code analyst. Provide helpful insights and suggestions for the given code or query.`;
    }
  }

  /**
   * Build user prompt from query
   */
  private buildUserPrompt(query: AIQuery): string {
    let prompt = query.query;
    
    if (query.context) {
      prompt += `\n\nContext: ${query.context}`;
    }
    
    // Add specific instructions based on query type
    switch (query.type) {
      case 'analysis':
        prompt += `\n\nPlease analyze this and provide specific insights about code quality, performance, security, and maintainability.`;
        break;
      case 'suggestion':
        prompt += `\n\nPlease provide specific, actionable suggestions for improvement.`;
        break;
      case 'explanation':
        prompt += `\n\nPlease explain this in detail with clear examples.`;
        break;
      case 'refactor':
        prompt += `\n\nPlease suggest specific refactoring improvements with code examples.`;
        break;
      case 'create':
        prompt += `\n\nPlease generate complete, production-ready code following best practices and include proper documentation.`;
        break;
      case 'read':
        prompt += `\n\nPlease analyze and explain this code, including its purpose, functionality, and how it fits into the larger system.`;
        break;
      case 'update':
        prompt += `\n\nPlease provide the updated code while maintaining existing functionality and improving quality.`;
        break;
      case 'delete':
        prompt += `\n\nPlease analyze whether this code should be deleted and provide recommendations with reasoning.`;
        break;
      case 'search':
        prompt += `\n\nPlease help locate relevant code and provide specific file paths and code snippets.`;
        break;
      case 'generate':
        prompt += `\n\nPlease generate complete, functional code with proper structure, error handling, and documentation.`;
        break;
    }
    
    return prompt;
  }

  /**
   * Parse AI response into our format
   */
  private parseAIResponse(aiResponse: string, query: AIQuery): AIResponse {
    // Try to extract structured information from the response
    const suggestions = this.extractSuggestions(aiResponse);
    const relatedFiles = this.extractRelatedFiles(aiResponse);
    const codeExamples = this.extractCodeExamples(aiResponse);
    
    return {
      answer: aiResponse,
      confidence: 0.9, // High confidence for real AI responses
      suggestions,
      relatedFiles,
      codeExamples
    };
  }

  /**
   * Extract suggestions from AI response
   */
  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    // Look for numbered lists or bullet points
    const lines = response.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\./) || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        suggestions.push(trimmed.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''));
      }
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Extract related files from AI response
   */
  private extractRelatedFiles(response: string): string[] {
    const files: string[] = [];
    
    // Look for file paths or references
    const filePattern = /([a-zA-Z0-9_/.-]+\.(ts|js|tsx|jsx|py|java|cpp|c|h|css|html|json|yml|yaml|md))/g;
    const matches = response.match(filePattern);
    
    if (matches) {
      files.push(...matches.slice(0, 5)); // Limit to 5 files
    }
    
    return files;
  }

  /**
   * Extract code examples from AI response
   */
  private extractCodeExamples(response: string): CodeExample[] {
    const examples: CodeExample[] = [];
    
    // Look for code blocks
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockPattern.exec(response)) !== null) {
      const language = match[1] || 'text';
      const code = match[2]?.trim() || '';
      
      if (code.length > 10) { // Only include substantial code blocks
        examples.push({
          language,
          code,
          description: `Code example in ${language}`
        });
      }
    }
    
    return examples.slice(0, 3); // Limit to 3 examples
  }

  /**
   * Check if AI service is enabled
   */
  public isAIServiceEnabled(): boolean {
    return this.isEnabled;
  }
}
