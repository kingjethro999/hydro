#!/usr/bin/env node

/**
 * Test script for AI integration across different codebase sizes
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`)
};

class AIIntegrationTester {
  constructor() {
    this.testResults = [];
    this.testDir = path.join(__dirname, '..', 'test-ai-integration');
  }

  async runAllTests() {
    logger.info('Starting AI Integration Tests');
    logger.info('='.repeat(50));

    try {
      // Setup test environment
      await this.setupTestEnvironment();

      // Test AI service initialization
      await this.testAIServiceInitialization();

      // Test small codebase (1-10 files)
      await this.testSmallCodebase();

      // Test medium codebase (10-100 files)
      await this.testMediumCodebase();

      // Test large codebase simulation (100+ files)
      await this.testLargeCodebase();

      // Test CRUD operations
      await this.testCRUDOperations();

      // Test bulk AI processing
      await this.testBulkAIProcessing();

      // Display results
      this.displayResults();

    } catch (error) {
      logger.error(`Test suite failed: ${error.message}`);
      process.exit(1);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  async setupTestEnvironment() {
    logger.info('Setting up test environment...');
    
    try {
      // Create test directory
      await fs.mkdir(this.testDir, { recursive: true });
      
      // Create test files for different scenarios
      await this.createTestFiles();
      
      logger.success('Test environment setup complete');
    } catch (error) {
      throw new Error(`Failed to setup test environment: ${error.message}`);
    }
  }

  async createTestFiles() {
    const testFiles = {
      // Small codebase files
      'small/calculator.ts': `
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
  
  subtract(a: number, b: number): number {
    return a - b;
  }
  
  multiply(a: number, b: number): number {
    return a * b;
  }
  
  divide(a: number, b: number): number {
    if (b === 0) throw new Error('Division by zero');
    return a / b;
  }
}
      `,
      
      'small/utils.ts': `
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
      `,

      // Medium codebase files
      'medium/user-service.ts': `
import { User } from './types';
import { Database } from './database';

export class UserService {
  constructor(private db: Database) {}

  async createUser(userData: Partial<User>): Promise<User> {
    // Validation logic
    if (!userData.email || !userData.name) {
      throw new Error('Email and name are required');
    }
    
    // Check if user already exists
    const existingUser = await this.db.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Create user
    const user = await this.db.createUser(userData);
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    return await this.db.findUserById(id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    return await this.db.updateUser(id, updates);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    await this.db.deleteUser(id);
  }
}
      `,

      'medium/types.ts': `
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}
      `,

      // Large codebase simulation files
      'large/api/controllers/user-controller.ts': `
import { Request, Response } from 'express';
import { UserService } from '../services/user-service';
import { validateUserInput } from '../validators/user-validator';

export class UserController {
  constructor(private userService: UserService) {}

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = validateUserInput(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const user = await this.userService.createUser(value);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.getUser(id);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { error, value } = validateUserInput(req.body, true);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const user = await this.userService.updateUser(id, value);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
      `,

      'large/api/services/user-service.ts': `
import { User, CreateUserRequest, UpdateUserRequest } from '../../types';
import { Database } from '../../database';
import { EmailService } from './email-service';
import { Logger } from '../../utils/logger';

export class UserService {
  constructor(
    private db: Database,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async createUser(userData: CreateUserRequest): Promise<User> {
    this.logger.info('Creating new user', { email: userData.email });
    
    // Validate input
    if (!userData.email || !userData.name) {
      throw new Error('Email and name are required');
    }
    
    // Check if user already exists
    const existingUser = await this.db.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password if provided
    const hashedPassword = userData.password ? 
      await this.hashPassword(userData.password) : undefined;
    
    // Create user
    const user = await this.db.createUser({
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      this.logger.warn('Failed to send welcome email', { userId: user.id, error });
    }
    
    this.logger.info('User created successfully', { userId: user.id });
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    this.logger.debug('Fetching user', { userId: id });
    return await this.db.findUserById(id);
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User> {
    this.logger.info('Updating user', { userId: id, updates });
    
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Hash new password if provided
    if (updates.password) {
      updates.password = await this.hashPassword(updates.password);
    }
    
    const updatedUser = await this.db.updateUser(id, {
      ...updates,
      updatedAt: new Date()
    });
    
    this.logger.info('User updated successfully', { userId: id });
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    this.logger.info('Deleting user', { userId: id });
    
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    await this.db.deleteUser(id);
    this.logger.info('User deleted successfully', { userId: id });
  }

  private async hashPassword(password: string): Promise<string> {
    // Simulate password hashing
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}
      `
    };

    for (const [filePath, content] of Object.entries(testFiles)) {
      const fullPath = path.join(this.testDir, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content.trim(), 'utf-8');
    }
  }

  async testAIServiceInitialization() {
    logger.info('Testing AI service initialization...');
    
    const testName = 'AI Service Initialization';
    const startTime = Date.now();
    
    try {
      const result = await this.runCommand('node', [
        '-e', `
        const { AIService } = require('../dist/ai/ai-service.js');
        const ai = AIService.getInstance();
        ai.initialize().then(() => {
          console.log('AI service initialized:', ai.isAIServiceEnabled());
        }).catch(err => {
          console.error('AI service failed:', err.message);
          process.exit(1);
        });
        `
      ]);
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration,
        details: result
      });
      
      logger.success(`${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message
      });
      
      logger.error(`${testName} - FAILED: ${error.message}`);
    }
  }

  async testSmallCodebase() {
    logger.info('Testing small codebase AI analysis...');
    
    const testName = 'Small Codebase Analysis';
    const startTime = Date.now();
    
    try {
      const result = await this.runCommand('npx', [
        'hydro', 'ai', '--analyze',
        '--path', path.join(this.testDir, 'small')
      ]);
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration,
        details: result
      });
      
      logger.success(`${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message
      });
      
      logger.error(`${testName} - FAILED: ${error.message}`);
    }
  }

  async testMediumCodebase() {
    logger.info('Testing medium codebase AI analysis...');
    
    const testName = 'Medium Codebase Analysis';
    const startTime = Date.now();
    
    try {
      const result = await this.runCommand('npx', [
        'hydro', 'bulk', '--ai-analyze', '--ai-suggestions',
        '--path', path.join(this.testDir, 'medium'),
        '--ai-batch-size', '3'
      ]);
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration,
        details: result
      });
      
      logger.success(`${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message
      });
      
      logger.error(`${testName} - FAILED: ${error.message}`);
    }
  }

  async testLargeCodebase() {
    logger.info('Testing large codebase AI analysis...');
    
    const testName = 'Large Codebase Analysis';
    const startTime = Date.now();
    
    try {
      const result = await this.runCommand('npx', [
        'hydro', 'bulk', '--ai-analyze', '--ai-suggestions', '--ai-refactor',
        '--path', path.join(this.testDir, 'large'),
        '--ai-batch-size', '2',
        '--deep-analysis'
      ]);
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration,
        details: result
      });
      
      logger.success(`${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message
      });
      
      logger.error(`${testName} - FAILED: ${error.message}`);
    }
  }

  async testCRUDOperations() {
    logger.info('Testing AI CRUD operations...');
    
    const testName = 'AI CRUD Operations';
    const startTime = Date.now();
    
    try {
      // Test create
      const createResult = await this.runCommand('npx', [
        'hydro', 'crud', '--create', 'TypeScript utility function for string validation',
        '--language', 'typescript',
        '--path', this.testDir
      ]);
      
      // Test read
      const readResult = await this.runCommand('npx', [
        'hydro', 'crud', '--read', path.join(this.testDir, 'small/calculator.ts'),
        '--path', this.testDir
      ]);
      
      // Test search
      const searchResult = await this.runCommand('npx', [
        'hydro', 'crud', '--search', 'user authentication logic',
        '--path', path.join(this.testDir, 'medium')
      ]);
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration,
        details: { createResult, readResult, searchResult }
      });
      
      logger.success(`${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message
      });
      
      logger.error(`${testName} - FAILED: ${error.message}`);
    }
  }

  async testBulkAIProcessing() {
    logger.info('Testing bulk AI processing...');
    
    const testName = 'Bulk AI Processing';
    const startTime = Date.now();
    
    try {
      const result = await this.runCommand('npx', [
        'hydro', 'bulk', '--ai-analyze', '--ai-suggestions',
        '--path', this.testDir,
        '--ai-batch-size', '3',
        '--max-concurrency', '2'
      ]);
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration,
        details: result
      });
      
      logger.success(`${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message
      });
      
      logger.error(`${testName} - FAILED: ${error.message}`);
    }
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '..'),
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  displayResults() {
    logger.info('\nTest Results Summary');
    logger.info('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const total = this.testResults.length;
    const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / total;
    
    logger.info(`Total Tests: ${total}`);
    logger.success(`Passed: ${passed}`);
    if (failed > 0) {
      logger.error(`Failed: ${failed}`);
    }
    logger.info(`Average Duration: ${avgDuration.toFixed(2)}ms`);
    
    logger.info('\nDetailed Results:');
    this.testResults.forEach(result => {
      const status = result.status === 'passed' ? '✅' : '❌';
      logger.info(`${status} ${result.name} (${result.duration}ms)`);
      if (result.error) {
        logger.error(`   Error: ${result.error}`);
      }
    });
    
    if (failed === 0) {
      logger.success('\n🎉 All AI integration tests passed!');
    } else {
      logger.error(`\n💥 ${failed} test(s) failed. Please check the errors above.`);
    }
  }

  async cleanup() {
    try {
      await fs.rm(this.testDir, { recursive: true, force: true });
      logger.info('Test cleanup completed');
    } catch (error) {
      logger.warn(`Cleanup failed: ${error.message}`);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new AIIntegrationTester();
  tester.runAllTests().catch(error => {
    logger.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = AIIntegrationTester;
