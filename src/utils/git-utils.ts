/**
 * Git utilities for Hydro operations
 */

import { execa } from 'execa';

import { logger } from '@/core/logger';

export interface GitStatus {
  isGitRepo: boolean;
  hasUncommittedChanges: boolean;
  currentBranch: string;
  uncommittedFiles: string[];
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: Date;
}

export class GitUtils {
  /**
   * Check if current directory is a Git repository
   */
  public static async isGitRepository(): Promise<boolean> {
    try {
      await execa('git', ['rev-parse', '--git-dir'], { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current Git status
   */
  public static async getStatus(): Promise<GitStatus> {
    const isGitRepo = await this.isGitRepository();
    
    if (!isGitRepo) {
      return {
        isGitRepo: false,
        hasUncommittedChanges: false,
        currentBranch: '',
        uncommittedFiles: [],
      };
    }

    try {
      // Get current branch
      const { stdout: branch } = await execa('git', ['branch', '--show-current'], { stdio: 'pipe' });
      
      // Get uncommitted files
      const { stdout: statusOutput } = await execa('git', ['status', '--porcelain'], { stdio: 'pipe' });
      const uncommittedFiles = statusOutput
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.substring(3)); // Remove status prefix

      return {
        isGitRepo: true,
        hasUncommittedChanges: uncommittedFiles.length > 0,
        currentBranch: branch.trim(),
        uncommittedFiles,
      };
    } catch (error) {
      logger.debug(`Failed to get Git status: ${error}`);
      return {
        isGitRepo: true,
        hasUncommittedChanges: false,
        currentBranch: '',
        uncommittedFiles: [],
      };
    }
  }

  /**
   * Create a commit with staged changes
   */
  public static async createCommit(message: string): Promise<string> {
    try {
      const { stdout } = await execa('git', ['commit', '-m', message], { stdio: 'pipe' });
      
      // Extract commit hash from output
      const hashMatch = stdout.match(/\[[\w-]+ ([a-f0-9]+)\]/);
      const commitHash = hashMatch?.[1] || '';
      
      logger.debug(`Created commit: ${commitHash}`);
      return commitHash;
    } catch (error) {
      throw new Error(`Failed to create commit: ${error}`);
    }
  }

  /**
   * Stage files for commit
   */
  public static async stageFiles(files: string[]): Promise<void> {
    if (files.length === 0) return;

    try {
      await execa('git', ['add', ...files], { stdio: 'pipe' });
      logger.debug(`Staged ${files.length} files`);
    } catch (error) {
      throw new Error(`Failed to stage files: ${error}`);
    }
  }

  /**
   * Create a new branch
   */
  public static async createBranch(branchName: string, switchTo: boolean = true): Promise<void> {
    try {
      if (switchTo) {
        await execa('git', ['checkout', '-b', branchName], { stdio: 'pipe' });
      } else {
        await execa('git', ['branch', branchName], { stdio: 'pipe' });
      }
      logger.debug(`Created branch: ${branchName}`);
    } catch (error) {
      throw new Error(`Failed to create branch: ${error}`);
    }
  }

  /**
   * Switch to a branch
   */
  public static async switchBranch(branchName: string): Promise<void> {
    try {
      await execa('git', ['checkout', branchName], { stdio: 'pipe' });
      logger.debug(`Switched to branch: ${branchName}`);
    } catch (error) {
      throw new Error(`Failed to switch to branch: ${error}`);
    }
  }

  /**
   * Get list of changed files between two commits/branches
   */
  public static async getChangedFiles(from: string, to: string = 'HEAD'): Promise<string[]> {
    try {
      const { stdout } = await execa('git', ['diff', '--name-only', from, to], { stdio: 'pipe' });
      return stdout.split('\n').filter(line => line.trim());
    } catch (error) {
      logger.debug(`Failed to get changed files: ${error}`);
      return [];
    }
  }

  /**
   * Get commit history
   */
  public static async getCommitHistory(count: number = 10): Promise<CommitInfo[]> {
    try {
      const format = '--pretty=format:%H|%s|%an|%ai';
      const { stdout } = await execa('git', ['log', format, `-${count}`], { stdio: 'pipe' });
      
      return stdout.split('\n').map(line => {
        const [hash, message, author, dateStr] = line.split('|');
        return {
          hash: hash || '',
          message: message || '',
          author: author || '',
          date: new Date(dateStr || ''),
        };
      });
    } catch (error) {
      logger.debug(`Failed to get commit history: ${error}`);
      return [];
    }
  }

  /**
   * Check if there are any merge conflicts
   */
  public static async hasMergeConflicts(): Promise<boolean> {
    try {
      const { stdout } = await execa('git', ['status', '--porcelain'], { stdio: 'pipe' });
      return stdout.includes('UU ') || stdout.includes('AA ') || stdout.includes('DD ');
    } catch {
      return false;
    }
  }

  /**
   * Get the root directory of the Git repository
   */
  public static async getRepositoryRoot(): Promise<string> {
    try {
      const { stdout } = await execa('git', ['rev-parse', '--show-toplevel'], { stdio: 'pipe' });
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get repository root: ${error}`);
    }
  }

  /**
   * Check if file is ignored by Git
   */
  public static async isIgnored(filePath: string): Promise<boolean> {
    try {
      await execa('git', ['check-ignore', filePath], { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file content from a specific commit
   */
  public static async getFileAtCommit(filePath: string, commitHash: string): Promise<string> {
    try {
      const { stdout } = await execa('git', ['show', `${commitHash}:${filePath}`], { stdio: 'pipe' });
      return stdout;
    } catch (error) {
      throw new Error(`Failed to get file content at commit: ${error}`);
    }
  }

  /**
   * Create a stash with a message
   */
  public static async createStash(message: string): Promise<void> {
    try {
      await execa('git', ['stash', 'push', '-m', message], { stdio: 'pipe' });
      logger.debug(`Created stash: ${message}`);
    } catch (error) {
      throw new Error(`Failed to create stash: ${error}`);
    }
  }

  /**
   * Apply the most recent stash
   */
  public static async applyStash(): Promise<void> {
    try {
      await execa('git', ['stash', 'pop'], { stdio: 'pipe' });
      logger.debug('Applied stash');
    } catch (error) {
      throw new Error(`Failed to apply stash: ${error}`);
    }
  }

  /**
   * Reset changes to specific files
   */
  public static async resetFiles(files: string[]): Promise<void> {
    if (files.length === 0) return;

    try {
      await execa('git', ['checkout', 'HEAD', '--', ...files], { stdio: 'pipe' });
      logger.debug(`Reset ${files.length} files`);
    } catch (error) {
      throw new Error(`Failed to reset files: ${error}`);
    }
  }

  /**
   * Get diff for specific files
   */
  public static async getDiff(files: string[], staged: boolean = false): Promise<string> {
    try {
      const args = ['diff'];
      if (staged) args.push('--cached');
      if (files.length > 0) args.push('--', ...files);

      const { stdout } = await execa('git', args, { stdio: 'pipe' });
      return stdout;
    } catch (error) {
      logger.debug(`Failed to get diff: ${error}`);
      return '';
    }
  }

  /**
   * Check if working directory is clean
   */
  public static async isWorkingDirectoryClean(): Promise<boolean> {
    try {
      const { stdout } = await execa('git', ['status', '--porcelain'], { stdio: 'pipe' });
      return stdout.trim().length === 0;
    } catch {
      return false;
    }
  }

  /**
   * Get remote URL
   */
  public static async getRemoteUrl(remoteName: string = 'origin'): Promise<string> {
    try {
      const { stdout } = await execa('git', ['remote', 'get-url', remoteName], { stdio: 'pipe' });
      return stdout.trim();
    } catch (error) {
      logger.debug(`Failed to get remote URL: ${error}`);
      return '';
    }
  }

  /**
   * Get list of all branches
   */
  public static async getBranches(includeRemote: boolean = false): Promise<string[]> {
    try {
      const args = ['branch'];
      if (includeRemote) args.push('-a');

      const { stdout } = await execa('git', args, { stdio: 'pipe' });
      return stdout
        .split('\n')
        .map(line => line.replace(/^\*?\s+/, '').trim())
        .filter(line => line && !line.startsWith('('));
    } catch (error) {
      logger.debug(`Failed to get branches: ${error}`);
      return [];
    }
  }
}
