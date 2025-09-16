/**
 * Team metrics analyzer for productivity and knowledge distribution
 */

import fs from 'fs-extra';
import path from 'path';

import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';

import type { FileInfo } from '@/core/file-scanner';

export interface TeamMetrics {
  productivity: ProductivityMetrics;
  knowledge: KnowledgeDistribution;
  collaboration: CollaborationMetrics;
  codeOwnership: CodeOwnershipMetrics;
}

export interface ProductivityMetrics {
  commitsPerDeveloper: Record<string, number>;
  linesAddedPerDeveloper: Record<string, number>;
  linesRemovedPerDeveloper: Record<string, number>;
  filesChangedPerDeveloper: Record<string, number>;
  averageCommitSize: Record<string, number>;
  activeDays: Record<string, number>;
}

export interface KnowledgeDistribution {
  fileOwnership: Record<string, string[]>; // file -> developers who worked on it
  expertiseAreas: Record<string, string[]>; // developer -> areas of expertise
  knowledgeGaps: string[]; // files with single owner
  crossTraining: CrossTrainingSuggestion[];
}

export interface CollaborationMetrics {
  pairProgramming: PairProgrammingSession[];
  codeReviews: CodeReviewMetrics;
  communication: CommunicationMetrics;
}

export interface CodeOwnershipMetrics {
  busFactor: Record<string, number>; // file -> bus factor (min developers needed)
  ownershipDistribution: Record<string, OwnershipInfo>;
  maintenanceBurden: Record<string, number>; // developer -> maintenance burden
}

export interface CrossTrainingSuggestion {
  file: string;
  currentOwner: string;
  suggestedTrainee: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PairProgrammingSession {
  developers: string[];
  files: string[];
  duration: number; // in hours
  date: Date;
}

export interface CodeReviewMetrics {
  reviewsPerDeveloper: Record<string, number>;
  reviewTime: Record<string, number>; // average review time in hours
  reviewCoverage: Record<string, number>; // percentage of code reviewed
}

export interface CommunicationMetrics {
  commitMessages: Record<string, string[]>; // developer -> commit messages
  issueComments: Record<string, number>;
  pullRequestComments: Record<string, number>;
}

export interface OwnershipInfo {
  primaryOwner: string;
  contributors: string[];
  lastModified: Date;
  modificationCount: number;
}

export class TeamMetricsAnalyzer {
  private fileScanner = new FileScanner();

  /**
   * Analyze team metrics from git history and codebase
   */
  public async analyzeTeamMetrics(
    files: FileInfo[],
    gitHistory?: GitHistoryData
  ): Promise<TeamMetrics> {
    logger.debug('Analyzing team metrics...');

    const productivity = await this.analyzeProductivity(gitHistory);
    const knowledge = await this.analyzeKnowledgeDistribution(files, gitHistory);
    const collaboration = await this.analyzeCollaboration(gitHistory);
    const codeOwnership = await this.analyzeCodeOwnership(files, gitHistory);

    return {
      productivity,
      knowledge,
      collaboration,
      codeOwnership,
    };
  }

  /**
   * Analyze productivity metrics
   */
  private async analyzeProductivity(gitHistory?: GitHistoryData): Promise<ProductivityMetrics> {
    if (!gitHistory) {
      return this.getDefaultProductivityMetrics();
    }

    const commitsPerDeveloper: Record<string, number> = {};
    const linesAddedPerDeveloper: Record<string, number> = {};
    const linesRemovedPerDeveloper: Record<string, number> = {};
    const filesChangedPerDeveloper: Record<string, number> = {};
    const averageCommitSize: Record<string, number> = {};
    const activeDays: Record<string, Set<string>> = {};

    // Process git commits
    for (const commit of gitHistory.commits) {
      const author = commit.author;

      // Initialize developer metrics
      if (!commitsPerDeveloper[author]) {
        commitsPerDeveloper[author] = 0;
        linesAddedPerDeveloper[author] = 0;
        linesRemovedPerDeveloper[author] = 0;
        filesChangedPerDeveloper[author] = 0;
        activeDays[author] = new Set();
      }

      commitsPerDeveloper[author]++;
      linesAddedPerDeveloper[author] += commit.linesAdded;
      linesRemovedPerDeveloper[author] += commit.linesRemoved;
      filesChangedPerDeveloper[author] += commit.filesChanged;
      activeDays[author].add(commit.date.toISOString().split('T')[0]);

      // Calculate average commit size
      const commitSize = commit.linesAdded + commit.linesRemoved;
      if (!averageCommitSize[author]) {
        averageCommitSize[author] = 0;
      }
      averageCommitSize[author] = (averageCommitSize[author] + commitSize) / 2;
    }

    // Convert active days to counts
    const activeDaysCount: Record<string, number> = {};
    for (const [developer, days] of Object.entries(activeDays)) {
      activeDaysCount[developer] = days.size;
    }

    return {
      commitsPerDeveloper,
      linesAddedPerDeveloper,
      linesRemovedPerDeveloper,
      filesChangedPerDeveloper,
      averageCommitSize,
      activeDays: activeDaysCount,
    };
  }

  /**
   * Analyze knowledge distribution
   */
  private async analyzeKnowledgeDistribution(
    files: FileInfo[],
    gitHistory?: GitHistoryData
  ): Promise<KnowledgeDistribution> {
    const fileOwnership: Record<string, string[]> = {};
    const expertiseAreas: Record<string, string[]> = {};
    const knowledgeGaps: string[] = [];

    // Initialize file ownership
    for (const file of files) {
      fileOwnership[file.relativePath] = [];
    }

    if (gitHistory) {
      // Process git history to determine file ownership
      for (const commit of gitHistory.commits) {
        for (const file of commit.files) {
          if (fileOwnership[file]) {
            if (!fileOwnership[file].includes(commit.author)) {
              fileOwnership[file].push(commit.author);
            }
          }
        }
      }

      // Identify knowledge gaps (files with single owner)
      for (const [file, owners] of Object.entries(fileOwnership)) {
        if (owners.length === 1) {
          knowledgeGaps.push(file);
        }
      }

      // Determine expertise areas
      for (const [developer, commits] of Object.entries(gitHistory.commitsByDeveloper)) {
        const areas = this.determineExpertiseAreas(commits, files);
        expertiseAreas[developer] = areas;
      }
    }

    // Generate cross-training suggestions
    const crossTraining = this.generateCrossTrainingSuggestions(fileOwnership, expertiseAreas);

    return {
      fileOwnership,
      expertiseAreas,
      knowledgeGaps,
      crossTraining,
    };
  }

  /**
   * Analyze collaboration metrics
   */
  private async analyzeCollaboration(gitHistory?: GitHistoryData): Promise<CollaborationMetrics> {
    if (!gitHistory) {
      return this.getDefaultCollaborationMetrics();
    }

    const pairProgramming = this.identifyPairProgramming(gitHistory);
    const codeReviews = this.analyzeCodeReviews(gitHistory);
    const communication = this.analyzeCommunication(gitHistory);

    return {
      pairProgramming,
      codeReviews,
      communication,
    };
  }

  /**
   * Analyze code ownership
   */
  private async analyzeCodeOwnership(
    files: FileInfo[],
    gitHistory?: GitHistoryData
  ): Promise<CodeOwnershipMetrics> {
    const busFactor: Record<string, number> = {};
    const ownershipDistribution: Record<string, OwnershipInfo> = {};
    const maintenanceBurden: Record<string, number> = {};

    if (gitHistory) {
      // Calculate bus factor for each file
      for (const file of files) {
        const fileCommits = gitHistory.commits.filter(c => c.files.includes(file.relativePath));
        const uniqueAuthors = new Set(fileCommits.map(c => c.author));
        busFactor[file.relativePath] = uniqueAuthors.size;

        // Determine ownership distribution
        const authors = Array.from(uniqueAuthors);
        const authorCommitCounts = authors.map(author =>
          fileCommits.filter(c => c.author === author).length
        );
        const totalCommits = authorCommitCounts.reduce((sum, count) => sum + count, 0);

        const primaryOwner = authors[authorCommitCounts.indexOf(Math.max(...authorCommitCounts))];
        if (!primaryOwner) continue; // Skip if no primary owner
        const lastCommit = fileCommits.sort((a, b) => b.date.getTime() - a.date.getTime())[0];

        ownershipDistribution[file.relativePath] = {
          primaryOwner,
          contributors: authors,
          lastModified: lastCommit?.date || new Date(),
          modificationCount: totalCommits,
        };

        // Calculate maintenance burden
        for (const author of authors) {
          if (!maintenanceBurden[author]) {
            maintenanceBurden[author] = 0;
          }
          maintenanceBurden[author] += authorCommitCounts[authors.indexOf(author)];
        }
      }
    }

    return {
      busFactor,
      ownershipDistribution,
      maintenanceBurden,
    };
  }

  /**
   * Determine expertise areas for a developer
   */
  private determineExpertiseAreas(commits: GitCommit[], files: FileInfo[]): string[] {
    const fileTypes: Record<string, number> = {};
    const languages: Record<string, number> = {};

    for (const commit of commits) {
      for (const filePath of commit.files) {
        const file = files.find(f => f.relativePath === filePath);
        if (file) {
          // Count by file type
          const fileType = this.getFileType(filePath);
          fileTypes[fileType] = (fileTypes[fileType] || 0) + 1;

          // Count by language
          if (file.language) {
            languages[file.language] = (languages[file.language] || 0) + 1;
          }
        }
      }
    }

    const areas: string[] = [];

    // Add top file types
    const topFileTypes = Object.entries(fileTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
    areas.push(...topFileTypes);

    // Add top languages
    const topLanguages = Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([lang]) => lang);
    areas.push(...topLanguages);

    return [...new Set(areas)];
  }

  /**
   * Generate cross-training suggestions
   */
  private generateCrossTrainingSuggestions(
    fileOwnership: Record<string, string[]>,
    expertiseAreas: Record<string, string[]>
  ): CrossTrainingSuggestion[] {
    const suggestions: CrossTrainingSuggestion[] = [];

    for (const [file, owners] of Object.entries(fileOwnership)) {
      if (owners.length === 1) {
        const currentOwner = owners[0];
        const ownerExpertise = expertiseAreas[currentOwner] || [];

        // Find developers with similar expertise who could learn this file
        for (const [developer, expertise] of Object.entries(expertiseAreas)) {
          if (developer !== currentOwner) {
            const commonExpertise = expertise.filter(area => ownerExpertise.includes(area));
            if (commonExpertise.length > 0) {
              suggestions.push({
                file,
                currentOwner,
                suggestedTrainee: developer,
                reason: `Shared expertise in: ${commonExpertise.join(', ')}`,
                priority: commonExpertise.length >= 2 ? 'high' : 'medium',
              });
            }
          }
        }
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Identify pair programming sessions
   */
  private identifyPairProgramming(gitHistory: GitHistoryData): PairProgrammingSession[] {
    const sessions: PairProgrammingSession[] = [];
    const commits = gitHistory.commits;

    // Group commits by date and look for multiple authors on same files
    const commitsByDate = new Map<string, GitCommit[]>();

    for (const commit of commits) {
      const date = commit.date.toISOString().split('T')[0];
      if (!commitsByDate.has(date)) {
        commitsByDate.set(date, []);
      }
      commitsByDate.get(date)!.push(commit);
    }

    for (const [date, dayCommits] of commitsByDate) {
      // Look for commits with overlapping files and different authors
      for (let i = 0; i < dayCommits.length; i++) {
        for (let j = i + 1; j < dayCommits.length; j++) {
          const commit1 = dayCommits[i];
          const commit2 = dayCommits[j];

          if (commit1.author !== commit2.author) {
            const commonFiles = commit1.files.filter(f => commit2.files.includes(f));
            if (commonFiles.length > 0) {
              sessions.push({
                developers: [commit1.author, commit2.author],
                files: commonFiles,
                duration: 2, // Estimate 2 hours for pair programming
                date: commit1.date,
              });
            }
          }
        }
      }
    }

    return sessions;
  }

  /**
   * Analyze code reviews
   */
  private analyzeCodeReviews(gitHistory: GitHistoryData): CodeReviewMetrics {
    const reviewsPerDeveloper: Record<string, number> = {};
    const reviewTime: Record<string, number> = {};
    const reviewCoverage: Record<string, number> = {};

    // This would need actual PR/merge request data
    // For now, estimate based on commit patterns
    for (const commit of gitHistory.commits) {
      if (!reviewsPerDeveloper[commit.author]) {
        reviewsPerDeveloper[commit.author] = 0;
        reviewTime[commit.author] = 0;
        reviewCoverage[commit.author] = 0;
      }

      // Estimate reviews based on commit size and frequency
      const estimatedReviews = Math.min(commit.filesChanged, 5);
      reviewsPerDeveloper[commit.author] += estimatedReviews;
      reviewTime[commit.author] += estimatedReviews * 0.5; // 30 min per review
      reviewCoverage[commit.author] = Math.min(100, reviewCoverage[commit.author] + 10);
    }

    return {
      reviewsPerDeveloper,
      reviewTime,
      reviewCoverage,
    };
  }

  /**
   * Analyze communication patterns
   */
  private analyzeCommunication(gitHistory: GitHistoryData): CommunicationMetrics {
    const commitMessages: Record<string, string[]> = {};
    const issueComments: Record<string, number> = {};
    const pullRequestComments: Record<string, number> = {};

    for (const commit of gitHistory.commits) {
      if (!commitMessages[commit.author]) {
        commitMessages[commit.author] = [];
        issueComments[commit.author] = 0;
        pullRequestComments[commit.author] = 0;
      }

      commitMessages[commit.author].push(commit.message);

      // Estimate communication based on commit message length and content
      const messageLength = commit.message.length;
      if (messageLength > 100) {
        issueComments[commit.author] += 1;
      }
      if (commit.message.includes('PR') || commit.message.includes('pull request')) {
        pullRequestComments[commit.author] += 1;
      }
    }

    return {
      commitMessages,
      issueComments,
      pullRequestComments,
    };
  }

  /**
   * Get file type from path
   */
  private getFileType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath).toLowerCase();

    if (dir.includes('test') || dir.includes('spec')) return 'testing';
    if (dir.includes('component') || dir.includes('ui')) return 'ui';
    if (dir.includes('service') || dir.includes('api')) return 'backend';
    if (dir.includes('util') || dir.includes('helper')) return 'utilities';
    if (ext === '.md' || ext === '.txt') return 'documentation';
    if (ext === '.json' || ext === '.yaml' || ext === '.yml') return 'configuration';

    return 'source';
  }

  /**
   * Get default productivity metrics
   */
  private getDefaultProductivityMetrics(): ProductivityMetrics {
    return {
      commitsPerDeveloper: {},
      linesAddedPerDeveloper: {},
      linesRemovedPerDeveloper: {},
      filesChangedPerDeveloper: {},
      averageCommitSize: {},
      activeDays: {},
    };
  }

  /**
   * Get default collaboration metrics
   */
  private getDefaultCollaborationMetrics(): CollaborationMetrics {
    return {
      pairProgramming: [],
      codeReviews: {
        reviewsPerDeveloper: {},
        reviewTime: {},
        reviewCoverage: {},
      },
      communication: {
        commitMessages: {},
        issueComments: {},
        pullRequestComments: {},
      },
    };
  }
}

// Git history data interfaces
export interface GitHistoryData {
  commits: GitCommit[];
  commitsByDeveloper: Record<string, GitCommit[]>;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: Date;
  message: string;
  files: string[];
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;
}
