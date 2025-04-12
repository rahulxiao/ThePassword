document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const passwordInput = document.getElementById('password-input');
    const rulesContainer = document.getElementById('rules-container');
    const levelCompletion = document.getElementById('level-completion');
    const totalRulesSpan = document.getElementById('total-rules');
    const finalPasswordSpan = document.getElementById('final-password');
    const restartButton = document.getElementById('restart-button');
    const charCounter = document.querySelector('.char-counter');
    const nextRuleContainer = document.querySelector('.next-rule-container');
    const nextRuleText = document.querySelector('.next-rule-text');

    // Game state
    let currentRules = [];
    let activeRules = [];
    let completedRules = [];
    let pendingRules = [];
    let currentRuleIndex = 0;
    let gameCompleted = false;

    // Rule definitions
    const ruleDefinitions = [
        {
            id: 'length',
            description: 'Your password must be at least 5 characters.',
            validate: (password) => password.length >= 5
        },
        {
            id: 'number',
            description: 'Your password must include a number.',
            validate: (password) => /\d/.test(password)
        },
        {
            id: 'uppercase',
            description: 'Your password must include an uppercase letter.',
            validate: (password) => /[A-Z]/.test(password)
        },
        {
            id: 'special',
            description: 'Your password must include a special character (!@#$%^&*?).',
            validate: (password) => /[!@#$%^&*?]/.test(password)
        },
        {
            id: 'roman',
            description: 'Your password must include a Roman numeral.',
            validate: (password) => /[IVXLCDM]/.test(password)
        },
        {
            id: 'month',
            description: 'Your password must include a month of the year (e.g., January).',
            validate: (password) => {
                const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                                'july', 'august', 'september', 'october', 'november', 'december'];
                return months.some(month => password.toLowerCase().includes(month));
            }
        },
        {
            id: 'consecutive',
            description: 'Your password must not contain three consecutive characters (e.g., abc, 123).',
            validate: (password) => {
                for (let i = 0; i < password.length - 2; i++) {
                    const char1 = password.charCodeAt(i);
                    const char2 = password.charCodeAt(i + 1);
                    const char3 = password.charCodeAt(i + 2);
                    
                    if (char2 - char1 === 1 && char3 - char2 === 1) {
                        return false;
                    }
                }
                return true;
            }
        },
        {
            id: 'palindrome',
            description: 'Your password must contain a palindrome that is at least 3 characters long.',
            validate: (password) => {
                for (let i = 0; i < password.length - 2; i++) {
                    for (let j = i + 2; j < password.length; j++) {
                        const substr = password.substring(i, j + 1);
                        const reversed = substr.split('').reverse().join('');
                        if (substr === reversed && substr.length >= 3) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },
        {
            id: 'prime',
            description: 'Your password must contain a prime number.',
            validate: (password) => {
                const isPrime = (num) => {
                    if (num <= 1) return false;
                    if (num <= 3) return true;
                    if (num % 2 === 0 || num % 3 === 0) return false;
                    
                    let i = 5;
                    while (i * i <= num) {
                        if (num % i === 0 || num % (i + 2) === 0) return false;
                        i += 6;
                    }
                    return true;
                };
                
                // Check for standalone numbers in the password
                const matches = password.match(/\d+/g);
                if (!matches) return false;
                
                return matches.some(numStr => isPrime(parseInt(numStr, 10)));
            }
        },
        {
            id: 'sum25',
            description: 'The sum of all numbers in your password must equal 25.',
            validate: (password) => {
                const matches = password.match(/\d+/g);
                if (!matches) return false;
                
                const sum = matches.reduce((acc, numStr) => {
                    const num = parseInt(numStr, 10);
                    return acc + [...numStr].reduce((a, digit) => a + parseInt(digit, 10), 0);
                }, 0);
                
                return sum === 25;
            }
        },
        {
            id: 'color',
            description: 'Your password must include a color (e.g., red, blue, green).',
            validate: (password) => {
                const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 
                              'pink', 'brown', 'black', 'white', 'gray', 'cyan', 
                              'magenta', 'teal', 'violet', 'indigo', 'turquoise'];
                return colors.some(color => password.toLowerCase().includes(color));
            }
        },
        {
            id: 'animal',
            description: 'Your password must include an animal name.',
            validate: (password) => {
                const animals = ['dog', 'cat', 'bird', 'fish', 'lion', 'tiger', 
                                'bear', 'wolf', 'fox', 'deer', 'snake', 'eagle',
                                'shark', 'whale', 'dolphin', 'elephant', 'giraffe'];
                return animals.some(animal => password.toLowerCase().includes(animal));
            }
        },
        {
            id: 'capitalCity',
            description: 'Your password must include a capital city (e.g., Paris, Tokyo, London).',
            validate: (password) => {
                const cities = ['paris', 'tokyo', 'london', 'berlin', 'rome', 
                              'madrid', 'moscow', 'beijing', 'cairo', 'delhi',
                              'ottawa', 'canberra', 'washington', 'brasilia'];
                return cities.some(city => password.toLowerCase().includes(city));
            }
        },
        {
            id: 'fibonacci',
            description: 'Your password must include a Fibonacci number (1, 1, 2, 3, 5, 8, 13, 21...).',
            validate: (password) => {
                const fibonacciNumbers = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
                const matches = password.match(/\d+/g);
                if (!matches) return false;
                
                return matches.some(numStr => {
                    const num = parseInt(numStr, 10);
                    return fibonacciNumbers.includes(num);
                });
            }
        },
        {
            id: 'emoji',
            description: 'Your password must include at least one emoji.',
            validate: (password) => /\p{Emoji}/u.test(password)
        },
        {
            id: 'length20',
            description: 'Your password must be at least 20 characters long.',
            validate: (password) => password.length >= 20
        },
        {
            id: 'country',
            description: 'Your password must include a country name.',
            validate: (password) => {
                const countries = ['usa', 'canada', 'mexico', 'france', 'germany', 'japan', 'china', 
                                  'india', 'brazil', 'australia', 'italy', 'spain', 'russia', 'uk'];
                return countries.some(country => password.toLowerCase().includes(country));
            }
        },
        {
            id: 'fruit',
            description: 'Your password must include a fruit name.',
            validate: (password) => {
                const fruits = ['apple', 'banana', 'orange', 'grape', 'strawberry', 'kiwi', 'mango', 
                              'peach', 'pear', 'cherry', 'pineapple', 'watermelon', 'lemon'];
                return fruits.some(fruit => password.toLowerCase().includes(fruit));
            }
        },
        {
            id: 'vowels',
            description: 'Your password must contain at least 5 vowels (a, e, i, o, u).',
            validate: (password) => {
                const vowels = password.toLowerCase().match(/[aeiou]/g);
                return vowels && vowels.length >= 5;
            }
        },
        {
            id: 'consonants',
            description: 'Your password must contain at least 8 consonants.',
            validate: (password) => {
                const consonants = password.toLowerCase().match(/[bcdfghjklmnpqrstvwxyz]/g);
                return consonants && consonants.length >= 8;
            }
        },
        {
            id: 'alternating',
            description: 'Your password must contain a sequence of at least 4 alternating letters and numbers (e.g., a1b2, 7k8l).',
            validate: (password) => {
                for (let i = 0; i < password.length - 3; i++) {
                    const isLetter1 = /[a-zA-Z]/.test(password[i]);
                    const isNumber1 = /[0-9]/.test(password[i]);
                    const isLetter2 = /[a-zA-Z]/.test(password[i+1]);
                    const isNumber2 = /[0-9]/.test(password[i+1]);
                    const isLetter3 = /[a-zA-Z]/.test(password[i+2]);
                    const isNumber3 = /[0-9]/.test(password[i+2]);
                    const isLetter4 = /[a-zA-Z]/.test(password[i+3]);
                    const isNumber4 = /[0-9]/.test(password[i+3]);
                    
                    if ((isLetter1 && isNumber2 && isLetter3 && isNumber4) || 
                        (isNumber1 && isLetter2 && isNumber3 && isLetter4)) {
                        return true;
                    }
                }
                return false;
            }
        },
        {
            id: 'ascending',
            description: 'Your password must include 3 consecutive ascending numbers (e.g., 123, 456).',
            validate: (password) => {
                for (let i = 0; i < password.length - 2; i++) {
                    if (/\d/.test(password[i]) && 
                        /\d/.test(password[i+1]) && 
                        /\d/.test(password[i+2])) {
                        const num1 = parseInt(password[i], 10);
                        const num2 = parseInt(password[i+1], 10);
                        const num3 = parseInt(password[i+2], 10);
                        if (num2 === num1 + 1 && num3 === num2 + 1) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },
        {
            id: 'element',
            description: 'Your password must include the symbol of a chemical element (e.g., H, Fe, Au).',
            validate: (password) => {
                const elements = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 
                                 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
                                 'Fe', 'Au', 'Ag', 'Cu', 'Zn', 'Hg', 'Pb'];
                return elements.some(element => 
                    new RegExp(element, 'i').test(password) && 
                    password.includes(element)
                );
            }
        },
        {
            id: 'dayofweek',
            description: 'Your password must include a day of the week (e.g., Monday, Friday).',
            validate: (password) => {
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                return days.some(day => password.toLowerCase().includes(day));
            }
        },
        {
            id: 'mathematical',
            description: 'Your password must include a mathematical operator (+, -, *, /, =, %).',
            validate: (password) => /[+\-*\/=%]/.test(password)
        },
        {
            id: 'brackets',
            description: 'Your password must include a matched pair of brackets ((), [], {}).',
            validate: (password) => {
                return (/\(\)/.test(password) || /\[\]/.test(password) || /\{\}/.test(password));
            }
        },
        {
            id: 'planet',
            description: 'Your password must include the name of a planet in our solar system.',
            validate: (password) => {
                const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
                return planets.some(planet => password.toLowerCase().includes(planet));
            }
        },
        {
            id: 'sport',
            description: 'Your password must include the name of a sport.',
            validate: (password) => {
                const sports = ['soccer', 'football', 'basketball', 'tennis', 'golf', 'hockey', 'baseball', 
                              'volleyball', 'cricket', 'rugby', 'swimming', 'boxing'];
                return sports.some(sport => password.toLowerCase().includes(sport));
            }
        },
        {
            id: 'instrument',
            description: 'Your password must include a musical instrument.',
            validate: (password) => {
                const instruments = ['piano', 'guitar', 'violin', 'drums', 'flute', 'trumpet', 'saxophone', 
                                   'harp', 'cello', 'clarinet', 'accordion'];
                return instruments.some(instrument => password.toLowerCase().includes(instrument));
            }
        },
        {
            id: 'season',
            description: 'Your password must include a season (spring, summer, autumn/fall, winter).',
            validate: (password) => {
                const seasons = ['spring', 'summer', 'autumn', 'fall', 'winter'];
                return seasons.some(season => password.toLowerCase().includes(season));
            }
        },
        {
            id: 'currency',
            description: 'Your password must include a currency symbol (€, $, £, ¥).',
            validate: (password) => /[€$£¥]/.test(password)
        },
        {
            id: 'compass',
            description: 'Your password must include a compass direction (north, south, east, west).',
            validate: (password) => {
                const directions = ['north', 'south', 'east', 'west'];
                return directions.some(direction => password.toLowerCase().includes(direction));
            }
        },
        {
            id: 'repeating',
            description: 'Your password must include a character that repeats at least 3 times consecutively.',
            validate: (password) => /(.)\1{2,}/.test(password)
        },
        {
            id: 'programmingLanguage',
            description: 'Your password must include the name of a programming language.',
            validate: (password) => {
                const languages = ['java', 'python', 'javascript', 'ruby', 'php', 'go', 'swift', 
                                 'kotlin', 'rust', 'c', 'typescript', 'perl'];
                return languages.some(language => password.toLowerCase().includes(language));
            }
        },
        {
            id: 'length50',
            description: 'Your password must be at least 50 characters long.',
            validate: (password) => password.length >= 50
        },
        {
            id: 'timestamp',
            description: 'Your password must include a timestamp in the format HH:MM (e.g., 14:30).',
            validate: (password) => /([01]?[0-9]|2[0-3]):[0-5][0-9]/.test(password)
        },
        {
            id: 'quote',
            description: 'Your password must include text inside quotation marks (e.g., "hello").',
            validate: (password) => /"[^"]*"/.test(password)
        },
        {
            id: 'temperature',
            description: 'Your password must include a temperature with °C or °F (e.g., 32°F).',
            validate: (password) => /-?\d+\s*[°℃℉CF]/.test(password)
        },
        {
            id: 'twoPairs',
            description: 'Your password must include at least two different pairs of identical characters (e.g., "aa" and "bb").',
            validate: (password) => {
                const matches = password.match(/(.)\1+/g);
                if (!matches || matches.length < 2) return false;
                
                const uniqueChars = new Set(matches.map(m => m[0]));
                return uniqueChars.size >= 2;
            }
        },
        {
            id: 'evenLength',
            description: 'Your password must have an even number of characters.',
            validate: (password) => password.length % 2 === 0
        },
        {
            id: 'domain',
            description: 'Your password must include a web domain (e.g., example.com).',
            validate: (password) => /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(password)
        },
        {
            id: 'tripleVowel',
            description: 'Your password must include 3 consecutive vowels.',
            validate: (password) => /[aeiou]{3}/i.test(password)
        },
        {
            id: 'hashtag',
            description: 'Your password must include a hashtag (e.g., #password).',
            validate: (password) => /#[a-zA-Z0-9_]+/.test(password)
        },
        {
            id: 'currencyAmount',
            description: 'Your password must include a currency amount (e.g., $10.99, €50).',
            validate: (password) => /[$€£¥]\s*\d+(\.\d{1,2})?/.test(password)
        },
        {
            id: 'ipAddress',
            description: 'Your password must include an IP address pattern (e.g., 192.168.1.1).',
            validate: (password) => /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(password)
        },
        {
            id: 'coordinate',
            description: 'Your password must include a coordinate pair (e.g., (42, -73)).',
            validate: (password) => /\(\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\)/.test(password)
        },
        {
            id: 'threeDigits',
            description: 'Your password must include exactly 3 consecutive digits that multiply to give 42.',
            validate: (password) => {
                for (let i = 0; i < password.length - 2; i++) {
                    if (/\d/.test(password[i]) && 
                        /\d/.test(password[i+1]) && 
                        /\d/.test(password[i+2])) {
                        const num1 = parseInt(password[i], 10);
                        const num2 = parseInt(password[i+1], 10);
                        const num3 = parseInt(password[i+2], 10);
                        if (num1 * num2 * num3 === 42) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },
        {
            id: 'website',
            description: 'Your password must include a website URL (e.g., http://example.com).',
            validate: (password) => /https?:\/\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(password)
        },
        {
            id: 'email',
            description: 'Your password must include an email address format (e.g., user@example.com).',
            validate: (password) => /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(password)
        },
        {
            id: 'chess',
            description: 'Your password must include a chess coordinate (e.g., e4, a1, h8).',
            validate: (password) => /[a-h][1-8]/.test(password)
        },
        {
            id: 'percentage',
            description: 'Your password must include a percentage (e.g., 50%, 100%).',
            validate: (password) => /\d+%/.test(password)
        },
        {
            id: 'piDigits',
            description: 'Your password must include the first 5 digits of pi (3.1415).',
            validate: (password) => password.includes('3.1415')
        },
        {
            id: 'equation',
            description: 'Your password must include a mathematical equation with = sign (e.g., 2+2=4).',
            validate: (password) => /[\d+\-*\/\^]+\s*=\s*\d+/.test(password)
        },
        {
            id: 'hexCode',
            description: 'Your password must include a hexadecimal color code (e.g., #FF0000).',
            validate: (password) => /#[0-9A-Fa-f]{6}/.test(password)
        },
        {
            id: 'phoneNumber',
            description: 'Your password must include a phone number format (e.g., 123-456-7890).',
            validate: (password) => /\d{3}[\-\s]?\d{3}[\-\s]?\d{4}/.test(password)
        },
        {
            id: 'socialmedia',
            description: 'Your password must include a social media handle (e.g., @username).',
            validate: (password) => /@[a-zA-Z0-9_]+/.test(password)
        },
        {
            id: 'card',
            description: 'Your password must include a playing card notation (e.g., K♠, 10♥, A♦, Q♣).',
            validate: (password) => /([AKQJ]|10|[2-9])[♠♥♦♣]/.test(password)
        },
        {
            id: 'year',
            description: 'Your password must include a year between 1900 and 2099.',
            validate: (password) => /\b(19|20)\d{2}\b/.test(password)
        },
        {
            id: 'metric',
            description: 'Your password must include a metric measurement (e.g., 5cm, 10kg, 2L).',
            validate: (password) => /\d+\s*(cm|m|km|g|kg|ml|L)/.test(password)
        },
        {
            id: 'binary',
            description: 'Your password must include a sequence of at least 8 binary digits (0s and 1s).',
            validate: (password) => /[01]{8,}/.test(password)
        },
        {
            id: 'uuid',
            description: 'Your password must include a UUID-like pattern (e.g., 123e4567-e89b-12d3-a456-426614174000).',
            validate: (password) => /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(password)
        },
        {
            id: 'emoji2',
            description: 'Your password must include at least 2 different emojis.',
            validate: (password) => {
                const emojiMatches = password.match(/\p{Emoji}/gu);
                if (!emojiMatches || emojiMatches.length < 2) return false;
                
                // Check if there are at least 2 different emojis
                const uniqueEmojis = new Set(emojiMatches);
                return uniqueEmojis.size >= 2;
            }
        },
        {
            id: 'length100',
            description: 'Your password must be at least 100 characters long.',
            validate: (password) => password.length >= 100
        }
    ];

    // Initialize game
    function initGame() {
        passwordInput.value = '';
        activeRules = [];
        currentRules = [];
        completedRules = [];
        pendingRules = [...ruleDefinitions]; // Copy all rules to pending
        currentRuleIndex = 0;
        gameCompleted = false;
        rulesContainer.innerHTML = '';
        levelCompletion.classList.add('hidden');
        
        if (nextRuleContainer) {
            nextRuleContainer.classList.remove('show');
        }
        
        if (charCounter) {
            charCounter.textContent = '0';
            charCounter.style.backgroundColor = 'var(--primary)';
        }
        
        // Add first rule
        addNextRule();
        
        // Focus on password input
        passwordInput.focus();
    }

    // Create the active rule section
    function createRuleSections() {
        // Create active rule section
        const activeRuleSection = document.createElement('div');
        activeRuleSection.id = 'active-rule-section';
        activeRuleSection.className = 'rule-section';
        
        // Create completed rules section
        const completedRuleSection = document.createElement('div');
        completedRuleSection.id = 'completed-rule-section';
        completedRuleSection.className = 'rule-section completed-section';
        
        // Add a heading for completed rules
        const completedHeading = document.createElement('h3');
        completedHeading.className = 'completed-heading';
        completedHeading.textContent = 'Completed Rules';
        completedRuleSection.appendChild(completedHeading);
        
        // Add to rules container
        rulesContainer.appendChild(activeRuleSection);
        rulesContainer.appendChild(completedRuleSection);
    }
    
    // Add a new rule to the game
    function addNextRule() {
        if (pendingRules.length === 0) return;
        
        // Make sure our rule sections exist
        if (!document.getElementById('active-rule-section')) {
            createRuleSections();
        }
        
        const activeRuleSection = document.getElementById('active-rule-section');
        
        // Clear any existing active rule
        activeRuleSection.innerHTML = '';
        
        // Get the next rule
        const newRule = pendingRules.shift();
        currentRules = [newRule]; // Set the current rule
        currentRuleIndex++;
        
        // Create rule element
        const ruleElement = document.createElement('div');
        ruleElement.className = 'rule invalid new';
        ruleElement.id = `rule-${newRule.id}`;
        ruleElement.innerHTML = `
            <span class="rule-number">Rule ${currentRuleIndex}</span>
            <span class="rule-text">${newRule.description}</span>
        `;
        
        // Add the rule with animation
        activeRuleSection.appendChild(ruleElement);
        
        // Apply a quick pop-up effect
        ruleElement.style.animation = 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        
        // Remove new class after animation completes
        setTimeout(() => {
            ruleElement.classList.remove('new');
        }, 600);
        
        validatePassword();
    }
    
    // Move a rule to the completed section
    function moveRuleToCompleted(rule) {
        const ruleElement = document.getElementById(`rule-${rule.id}`);
        if (!ruleElement) return;
        
        // Add to completed rules
        completedRules.push(rule);
        
        // Clone the element for the completed section
        const clonedRule = ruleElement.cloneNode(true);
        clonedRule.id = `completed-${rule.id}`;
        clonedRule.className = 'rule valid completed-rule';
        
        // Find the completed section
        const completedSection = document.getElementById('completed-rule-section');
        
        // Add it to completed section with animation
        completedSection.appendChild(clonedRule);
        clonedRule.style.animation = 'slideDown 0.5s forwards';
        
        // Remove the original rule immediately
        if (ruleElement.parentNode) {
            ruleElement.parentNode.removeChild(ruleElement);
        }
        
        // Add next rule immediately if available
        if (pendingRules.length > 0) {
            // Removed showNextRule() call to avoid popup
            addNextRule(); // No delay
        } else if (completedRules.length === ruleDefinitions.length) {
            completeGame();
        }
    }

    // Update character counter
    function updateCharCounter() {
        const password = passwordInput.value;
        charCounter.textContent = password.length;
        charCounter.style.backgroundColor = 
            password.length >= 20 ? 'var(--success)' : 
            password.length >= 10 ? 'var(--warning)' : 
            'var(--primary)';
    }
    
    // Show next rule preview
    function showNextRule() {
        if (pendingRules.length === 0) return;
        
        const nextRule = pendingRules[0];
        if (nextRuleText && nextRuleContainer) {
            nextRuleText.textContent = `Next challenge: ${nextRule.description}`;
            nextRuleContainer.classList.add('show');
            
            // Shorter display time
            setTimeout(() => {
                nextRuleContainer.classList.remove('show');
            }, 2000);
        }
    }
    
    // Validate password against all current rules
    function validatePassword() {
        const password = passwordInput.value;
        let allValid = true;
        let rulesToMove = [];
        let rulesToMoveBack = [];
        
        // Update character counter
        if (charCounter) {
            updateCharCounter();
        }
        
        // Check current active rules
        currentRules.forEach(rule => {
            const ruleElement = document.getElementById(`rule-${rule.id}`);
            if (!ruleElement) return;
            
            const isValid = rule.validate(password);
            const wasValid = ruleElement.classList.contains('valid');
            
            // If rule was just validated
            if (isValid && !wasValid) {
                rulesToMove.push(rule);
                // Add a highlight effect
                ruleElement.classList.add('valid');
                
                // Visual effect to indicate completion
                passwordInput.style.transition = 'all 0.3s';
                passwordInput.style.boxShadow = '0 0 10px var(--success)';
                setTimeout(() => {
                    passwordInput.style.boxShadow = '';
                }, 800);
            } else if (!isValid && wasValid) {
                // Remove valid class if rule is no longer valid
                ruleElement.classList.remove('valid');
            } else if (!isValid) {
                // Rule is still invalid
                allValid = false;
            }
        });
        
        // Check completed rules to see if any have become invalid
        completedRules.forEach(rule => {
            const isValid = rule.validate(password);
            if (!isValid) {
                rulesToMoveBack.push(rule);
            }
        });
        
        // Move rules that became invalid back to active section
        if (rulesToMoveBack.length > 0) {
            rulesToMoveBack.forEach(rule => {
                moveRuleBackToActive(rule);
            });
        }
        
        // Move completed rules to completed section
        if (rulesToMove.length > 0) {
            // Process immediately without delay
            rulesToMove.forEach(rule => {
                moveRuleToCompleted(rule);
                // Remove from current rules
                const index = currentRules.indexOf(rule);
                if (index > -1) {
                    currentRules.splice(index, 1);
                }
            });
        }
    }
    
    // Move a rule back from completed to active section
    function moveRuleBackToActive(rule) {
        // Remove from completed rules list
        const index = completedRules.indexOf(rule);
        if (index > -1) {
            completedRules.splice(index, 1);
        }
        
        // Remove from completed section in DOM
        const completedRuleElement = document.getElementById(`completed-${rule.id}`);
        if (completedRuleElement && completedRuleElement.parentNode) {
            completedRuleElement.parentNode.removeChild(completedRuleElement);
        }
        
        // Add to current rules list
        if (!currentRules.includes(rule)) {
            currentRules.push(rule);
        }
        
        // Add back to active section
        const activeRuleSection = document.getElementById('active-rule-section');
        if (activeRuleSection) {
            const ruleElement = document.createElement('div');
            ruleElement.className = 'rule invalid';
            ruleElement.id = `rule-${rule.id}`;
            ruleElement.innerHTML = `
                <span class="rule-number">Rule ${ruleDefinitions.indexOf(rule) + 1}</span>
                <span class="rule-text">${rule.description}</span>
            `;
            
            activeRuleSection.appendChild(ruleElement);
            ruleElement.style.animation = 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }
    }

    // Handle game completion
    function completeGame() {
        gameCompleted = true;
        const password = passwordInput.value;
        
        totalRulesSpan.textContent = ruleDefinitions.length;
        finalPasswordSpan.textContent = password;
        
        // Clear rules container and replace with completion message
        rulesContainer.innerHTML = '';
        
        // Create celebration container
        const celebrationContainer = document.createElement('div');
        celebrationContainer.className = 'celebration-container';
        
        // Create the completion content
        celebrationContainer.innerHTML = `
            <div class="completion-animation">🎉</div>
            <h2>Congratulations!</h2>
            <p>You have successfully created a password that meets all <span class="total-rules-count">${ruleDefinitions.length}</span> requirements!</p>
            <div class="password-summary">Your final password: <span class="final-password">${password}</span></div>
            <button id="restart-game-button">Play Again</button>
        `;
        
        // Add to rules container
        rulesContainer.appendChild(celebrationContainer);
        
        // Add event listener to the new restart button
        document.getElementById('restart-game-button').addEventListener('click', () => {
            initGame();
        });
        
        // Hide the original completion section (keeping for compatibility)
        levelCompletion.classList.add('hidden');
    }

    // Event listeners
    passwordInput.addEventListener('input', validatePassword);
    
    restartButton.addEventListener('click', () => {
        initGame();
    });

    // Start the game
    initGame();
});
