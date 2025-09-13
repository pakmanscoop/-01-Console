/**
 * Pixel Canvas Core Algorithm
 * Generates a deterministic randomized pixel canvas based on hash input
 */

class PixelCanvasCore {
    constructor() {
        // Canvas dimensions
        this.width = 19;
        this.height = 24;
        this.topWidth = 19;
        this.topHeight = 5;
        
        // Color definitions (off-white base, multiple accent colors)
        this.colors = {
            base: 'F5F5DC',      // Off-white (beige)
            accent1: 'FFD700',   // Pac-Man yellow
            accent2: '000000',   // Black
            accent3: '0000FF',   // Blue
            accent4: 'FF69B4',   // Pink
            accent5: 'FFA500',   // Orange
            accent6: 'FF0000',   // Red
            symbols: {
                'F5F5DC': '.',   // Base color symbol
                'FFD700': 'Y',   // Yellow symbol
                '000000': 'B',   // Black symbol
                '0000FF': 'U',   // Blue symbol
                'FF69B4': 'P',   // Pink symbol
                'FFA500': 'O',   // Orange symbol
                'FF0000': 'R'    // Red symbol
            }
        };
        
        // Default ratio: 50% base, 10% each accent color
        this.ratios = {
            base: 0.5,
            accent1: 0.1,
            accent2: 0.1,
            accent3: 0.1,
            accent4: 0.1,
            accent5: 0.1,
            accent6: 0.1
        };
        
        // Internal state
        this.canvas = null;
        this.rng = null;
    }

    /**
     * Simple hash function to convert string to number
     * @param {string} str - Input string
     * @returns {number} - Hash value
     */
    hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Seeded random number generator using Linear Congruential Generator
     * @param {number} seed - Seed value
     * @returns {function} - Random number generator function
     */
    createRNG(seed) {
        let current = seed;
        return () => {
            current = (current * 1664525 + 1013904223) % 4294967296;
            return current / 4294967296;
        };
    }

    /**
     * Get color for a given position based on ratios and constraints
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Array} canvas - Current canvas state
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {string} - Color hex code
     */
    getColorForPosition(x, y, canvas, width, height) {
        const neighbors = this.getNeighbors(x, y, canvas, width, height);
        const availableColors = this.getAvailableColors(neighbors);
        
        // If no colors available (shouldn't happen with proper ratios), use base
        if (availableColors.length === 0) {
            return this.colors.base;
        }
        
        // Weight available colors by their ratios
        const weightedColors = [];
        availableColors.forEach(color => {
            const weight = this.ratios[color] || 0;
            for (let i = 0; i < Math.floor(weight * 100); i++) {
                weightedColors.push(color);
            }
        });
        
        // Select random color from weighted options
        const randomIndex = Math.floor(this.rng() * weightedColors.length);
        return this.colors[weightedColors[randomIndex]];
    }

    /**
     * Get neighboring colors (up, down, left, right)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Array} canvas - Current canvas state
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {Array} - Array of neighboring colors
     */
    getNeighbors(x, y, canvas, width, height) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
        
        directions.forEach(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                neighbors.push(canvas[ny][nx]);
            }
        });
        
        return neighbors;
    }

    /**
     * Get available colors that don't violate adjacency rule
     * @param {Array} neighbors - Neighboring colors
     * @returns {Array} - Array of available color names
     */
    getAvailableColors(neighbors) {
        const available = [];
        const colorKeys = ['base', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'];
        
        colorKeys.forEach(colorKey => {
            const colorValue = this.colors[colorKey];
            // Base color can be adjacent to itself, but accent colors cannot
            if (colorKey === 'base' || !neighbors.includes(colorValue)) {
                available.push(colorKey);
            }
        });
        
        return available;
    }

    /**
     * Generate a canvas with specified dimensions
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {string} seedString - Seed string for deterministic generation
     * @param {Object} customRatios - Optional custom color ratios
     * @returns {Array} - Canvas data
     */
    generateCanvas(width, height, seedString, customRatios = null) {
        // Set custom ratios if provided
        if (customRatios) {
            this.ratios = { ...this.ratios, ...customRatios };
        }
        
        // Initialize random number generator
        const seed = this.hash(seedString);
        this.rng = this.createRNG(seed);
        
        // Initialize canvas with null values
        const canvas = Array(height).fill().map(() => Array(width).fill(null));
        
        // Fill canvas pixel by pixel
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                canvas[y][x] = this.getColorForPosition(x, y, canvas, width, height);
            }
        }
        
        return canvas;
    }

    /**
     * Generate both canvases (top and main)
     * @param {string} seedString - Seed string for deterministic generation
     * @param {Object} customRatios - Optional custom color ratios
     * @returns {Object} - Canvas data and metadata
     */
    generate(seedString, customRatios = null) {
        // Generate top canvas (19x5)
        const topCanvas = this.generateCanvas(this.topWidth, this.topHeight, seedString + '-top', customRatios);
        
        // Generate main canvas (19x24)
        const mainCanvas = this.generateCanvas(this.width, this.height, seedString + '-main', customRatios);
        
        // Initialize random number generator for metadata
        const seed = this.hash(seedString);
        
        return {
            topCanvas: topCanvas,
            canvas: mainCanvas,
            seed: seedString,
            seedValue: seed,
            ratios: this.ratios,
            dimensions: { 
                top: { width: this.topWidth, height: this.topHeight },
                main: { width: this.width, height: this.height }
            }
        };
    }

    /**
     * Convert canvas to symbol matrix for text output
     * @param {Array} canvas - Canvas data
     * @returns {string} - Text representation
     */
    toSymbolMatrix(canvas) {
        return canvas.map(row => 
            row.map(color => this.colors.symbols[color] || '?').join('')
        ).join('\n');
    }

    /**
     * Generate SVG representation of the canvas
     * @param {Array} canvas - Canvas data
     * @param {number} pixelSize - Size of each pixel in SVG (default: 20)
     * @returns {string} - SVG markup
     */
    toSVG(canvas, pixelSize = 20) {
        const svgWidth = this.width * pixelSize;
        const svgHeight = this.height * pixelSize;
        
        let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">\n`;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const color = canvas[y][x];
                const rectX = x * pixelSize;
                const rectY = y * pixelSize;
                svg += `  <rect x="${rectX}" y="${rectY}" width="${pixelSize}" height="${pixelSize}" fill="#${color}"/>\n`;
            }
        }
        
        svg += '</svg>';
        return svg;
    }

    /**
     * Generate combined SVG representation of both canvases
     * @param {Array} topCanvas - Top canvas data (19x5)
     * @param {Array} mainCanvas - Main canvas data (19x24)
     * @param {number} pixelSize - Size of each pixel in SVG (default: 20)
     * @param {number} gap - Gap between canvases in pixels (default: 40)
     * @returns {string} - SVG markup
     */
    toCombinedSVG(topCanvas, mainCanvas, pixelSize = 20, gap = 40) {
        const canvasWidth = this.width * pixelSize;
        const topHeight = this.topHeight * pixelSize;
        const mainHeight = this.height * pixelSize;
        const totalHeight = topHeight + gap + mainHeight;
        
        let svg = `<svg width="${canvasWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">\n`;
        
        // Top canvas (19x5)
        for (let y = 0; y < this.topHeight; y++) {
            for (let x = 0; x < this.topWidth; x++) {
                const color = topCanvas[y][x];
                const rectX = x * pixelSize;
                const rectY = y * pixelSize;
                svg += `  <rect x="${rectX}" y="${rectY}" width="${pixelSize}" height="${pixelSize}" fill="#${color}"/>\n`;
            }
        }
        
        // Main canvas (19x24) with gap
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const color = mainCanvas[y][x];
                const rectX = x * pixelSize;
                const rectY = topHeight + gap + (y * pixelSize);
                svg += `  <rect x="${rectX}" y="${rectY}" width="${pixelSize}" height="${pixelSize}" fill="#${color}"/>\n`;
            }
        }
        
        svg += '</svg>';
        return svg;
    }

    /**
     * Validate that adjacency rules are followed
     * @param {Array} canvas - Canvas data
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {boolean} - True if valid
     */
    validateCanvas(canvas, width = this.width, height = this.height) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const currentColor = canvas[y][x];
                const neighbors = this.getNeighbors(x, y, canvas, width, height);
                // Only base color can be adjacent to itself
                if (currentColor !== this.colors.base && neighbors.includes(currentColor)) {
                    return false;
                }
            }
        }
        return true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PixelCanvasCore;
}

// Example usage and testing
if (typeof window === 'undefined') {
    const generator = new PixelCanvasCore();
    
    // Test with sample seed
    const result = generator.generate('test-seed-123');
    
    console.log('Generated top canvas (19x5):');
    console.log(generator.toSymbolMatrix(result.topCanvas));
    console.log('\nGenerated main canvas (19x24):');
    console.log(generator.toSymbolMatrix(result.canvas));
    console.log('\nTop Validation:', generator.validateCanvas(result.topCanvas, 19, 5));
    console.log('Main Validation:', generator.validateCanvas(result.canvas, 19, 24));
    console.log('\nCombined SVG Output:');
    console.log(generator.toCombinedSVG(result.topCanvas, result.canvas));
}