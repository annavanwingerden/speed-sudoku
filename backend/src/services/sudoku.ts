interface SudokuPuzzle {
  puzzle: number[][];
  solution: number[][];
  difficulty: number;
  category: 'Easy' | 'Medium' | 'Hard' | 'Diabolical';
}

export class SudokuService {
  private static readonly DIFFICULTY_THRESHOLDS = {
    Easy: 1.5,
    Medium: 2.5,
    Hard: 5.0,
    Diabolical: Infinity
  };

  // Generate a new Sudoku puzzle with specified difficulty
  static generatePuzzle(difficulty: 'Easy' | 'Medium' | 'Hard' | 'Diabolical'): SudokuPuzzle {
    // Start with a solved board
    const solution = this.generateSolvedBoard();
    
    // Create a copy to work with
    const puzzle = solution.map(row => [...row]);
    
    // Remove numbers based on difficulty
    const cellsToRemove = this.getCellsToRemove(difficulty);
    this.removeNumbers(puzzle, cellsToRemove);
    
    // Calculate actual difficulty rating
    const rating = this.calculateDifficulty(puzzle);
    
    return {
      puzzle,
      solution,
      difficulty: rating,
      category: this.getDifficultyCategory(rating)
    };
  }

  // Generate a solved Sudoku board
  private static generateSolvedBoard(): number[][] {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    this.solveSudoku(board);
    return board;
  }

  // Solve a Sudoku puzzle using backtracking
  private static solveSudoku(board: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(board, row, col, num)) {
              board[row][col] = num;
              if (this.solveSudoku(board)) {
                return true;
              }
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  // Check if a move is valid
  private static isValidMove(board: number[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (board[x][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }

    return true;
  }

  // Get number of cells to remove based on difficulty
  private static getCellsToRemove(difficulty: string): number {
    switch (difficulty) {
      case 'Easy': return 30; // ~33% empty
      case 'Medium': return 40; // ~44% empty
      case 'Hard': return 50; // ~55% empty
      case 'Diabolical': return 60; // ~66% empty
      default: return 40;
    }
  }

  // Remove numbers from the board
  private static removeNumbers(board: number[][], count: number): void {
    let removed = 0;
    while (removed < count) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      if (board[row][col] !== 0) {
        board[row][col] = 0;
        removed++;
      }
    }
  }

  // Calculate difficulty rating based on solving techniques needed
  private static calculateDifficulty(puzzle: number[][]): number {
    let rating = 1.0; // Base rating for basic techniques

    // Check for hidden singles (rating: 1.5)
    if (this.hasHiddenSingles(puzzle)) {
      rating = Math.max(rating, 1.5);
    }

    // Check for naked pairs (rating: 2.0)
    if (this.hasNakedPairs(puzzle)) {
      rating = Math.max(rating, 2.0);
    }

    // Check for X-Wing pattern (rating: 3.2)
    if (this.hasXWing(puzzle)) {
      rating = Math.max(rating, 3.2);
    }

    // Add random variation to make puzzles more interesting
    rating += Math.random() * 0.5;

    return rating;
  }

  // Get difficulty category based on rating
  private static getDifficultyCategory(rating: number): 'Easy' | 'Medium' | 'Hard' | 'Diabolical' {
    if (rating < this.DIFFICULTY_THRESHOLDS.Easy) return 'Easy';
    if (rating < this.DIFFICULTY_THRESHOLDS.Medium) return 'Medium';
    if (rating < this.DIFFICULTY_THRESHOLDS.Hard) return 'Hard';
    return 'Diabolical';
  }

  // Check for hidden singles (cells that can only contain one number)
  private static hasHiddenSingles(puzzle: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (puzzle[row][col] === 0) {
          const possibleNumbers = new Set<number>();
          for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(puzzle, row, col, num)) {
              possibleNumbers.add(num);
            }
          }
          if (possibleNumbers.size === 1) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Check for naked pairs (two cells in a unit that can only contain the same two numbers)
  private static hasNakedPairs(puzzle: number[][]): boolean {
    // Check rows
    for (let row = 0; row < 9; row++) {
      const emptyCells = [];
      for (let col = 0; col < 9; col++) {
        if (puzzle[row][col] === 0) {
          const possibleNumbers = new Set<number>();
          for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(puzzle, row, col, num)) {
              possibleNumbers.add(num);
            }
          }
          if (possibleNumbers.size === 2) {
            emptyCells.push({ col, numbers: possibleNumbers });
          }
        }
      }
      
      // Check for pairs with same numbers
      for (let i = 0; i < emptyCells.length; i++) {
        for (let j = i + 1; j < emptyCells.length; j++) {
          if (this.areSetsEqual(emptyCells[i].numbers, emptyCells[j].numbers)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Check for X-Wing pattern
  private static hasXWing(puzzle: number[][]): boolean {
    for (let num = 1; num <= 9; num++) {
      // Check rows
      for (let row1 = 0; row1 < 9; row1++) {
        for (let row2 = row1 + 1; row2 < 9; row2++) {
          const cols1 = this.getPossibleColumns(puzzle, row1, num);
          const cols2 = this.getPossibleColumns(puzzle, row2, num);
          
          if (cols1.length === 2 && cols2.length === 2 && 
              this.areArraysEqual(cols1, cols2)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Helper method to check if two sets are equal
  private static areSetsEqual(set1: Set<number>, set2: Set<number>): boolean {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }

  // Helper method to check if two arrays are equal
  private static areArraysEqual(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  }

  // Helper method to get possible columns for a number in a row
  private static getPossibleColumns(puzzle: number[][], row: number, num: number): number[] {
    const cols: number[] = [];
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] === 0 && this.isValidMove(puzzle, row, col, num)) {
        cols.push(col);
      }
    }
    return cols;
  }
}

export function generateSudokuPuzzle(difficulty: string): number[][] {
  return SudokuService.generatePuzzle(difficulty as 'Easy' | 'Medium' | 'Hard' | 'Diabolical').puzzle;
} 