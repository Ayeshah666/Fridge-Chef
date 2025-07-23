document.addEventListener('DOMContentLoaded', function() {
    const ingredients = [];
    const OPENROUTER_API_KEY = 'your-api-key'; // Replace with your actual key
    const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Add ingredient to list
    document.getElementById('addIngredient').addEventListener('click', function() {
        const input = document.getElementById('ingredientInput');
        if (input.value.trim()) {
            ingredients.push(input.value.trim());
            updateIngredientList();
            input.value = '';
        }
    });
    
    // Generate recipes using OpenRouter
    document.getElementById('generateRecipes').addEventListener('click', async function() {
        if (ingredients.length === 0) {
            alert('Please add at least one ingredient');
            return;
        }
        
        showLoading();
        
        try {
            const recipes = await generateRecipes(ingredients);
            displayRecipes(recipes);
        } catch (error) {
            console.error('Error generating recipes:', error);
            showError(error);
        }
    });
    
    // Show loading state
    function showLoading() {
        document.getElementById('recipeResults').innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Generating delicious recipes...</p>
            </div>
        `;
    }
    
    // Show error state
    function showError(error) {
        document.getElementById('recipeResults').innerHTML = `
            <div class="alert alert-danger">
                <h4>Error Generating Recipes</h4>
                <p>${error.message || 'Please try again later.'}</p>
                ${ingredients.length > 0 ? `
                <button class="btn btn-sm btn-warning mt-2" id="tryAgain">
                    Try Again
                </button>
                ` : ''}
            </div>
        `;
        
        if (document.getElementById('tryAgain')) {
            document.getElementById('tryAgain').addEventListener('click', async () => {
                document.getElementById('generateRecipes').click();
            });
        }
    }
    
    // Generate recipes using OpenRouter API
    async function generateRecipes(ingredients) {
        const dietaryPrefs = getDietaryPreferences();
        
        const prompt = `Generate 3 detailed recipes using mainly these ingredients: ${ingredients.join(', ')}.
        ${dietaryPrefs ? `Dietary requirements: ${dietaryPrefs}.` : ''}
        For each recipe, include:
        - Creative recipe name
        - Preparation time
        - Cooking time
        - Detailed instructions
        - Serving size
        Format as JSON with this structure:
        {
            "recipes": [
                {
                    "name": "",
                    "prepTime": "",
                    "cookTime": "",
                    "ingredients": [],
                    "instructions": [],
                    "servings": ""
                }
            ]
        }`;
        
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.href, // Required by OpenRouter
                'X-Title': 'Fridge to Table' // Your app name
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo', // You can change this to any OpenRouter-supported model
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
            return JSON.parse(content).recipes;
        } catch (e) {
            console.error('Failed to parse recipes:', content);
            throw new Error('Received invalid recipe format from API');
        }
    }
    
    // Get selected dietary preferences
    // Update the getDietaryPreferences function
function getDietaryPreferences() {
    const prefs = [];
    
    // Safe check for vegan checkbox
    const veganCheck = document.getElementById('veganCheck');
    if (veganCheck && veganCheck.checked) prefs.push('vegan');
    
    // Safe check for gluten-free checkbox
    const glutenFreeCheck = document.getElementById('glutenFreeCheck');
    if (glutenFreeCheck && glutenFreeCheck.checked) prefs.push('gluten-free');
    
    // Safe check for keto checkbox
    const ketoCheck = document.getElementById('ketoCheck');
    if (ketoCheck && ketoCheck.checked) prefs.push('keto');
    
    return prefs.join(', ');
}
    
    // Display generated recipes
    function displayRecipes(recipes) {
        const container = document.getElementById('recipeResults');
        
        if (!recipes || recipes.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    No recipes found. Try adding more ingredients.
                </div>
            `;
            return;
        }
        
        let html = '';
        recipes.forEach(recipe => {
            html += `
                <div class="card mb-3">
                    <div class="card-header">
                        <h3>${recipe.name}</h3>
                        <div class="text-muted">
                            <span class="me-3">⏱️ Prep: ${recipe.prepTime}</span>
                            <span>🍳 Cook: ${recipe.cookTime}</span>
                            <span class="float-end">🍽️ Serves: ${recipe.servings}</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <h4>Ingredients</h4>
                        <ul>
                            ${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}
                        </ul>
                        
                        <h4 class="mt-3">Instructions</h4>
                        <ol>
                            ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
                        </ol>
                        
                        <button class="btn btn-sm btn-outline-primary save-recipe">Save Recipe</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Add save functionality
        document.querySelectorAll('.save-recipe').forEach(btn => {
            btn.addEventListener('click', function() {
                this.textContent = 'Saved!';
                this.classList.remove('btn-outline-primary');
                this.classList.add('btn-success');
                // Here you could add actual saving logic
            });
        });
    }
    
    // Update visual ingredient list
    function updateIngredientList() {
        const container = document.getElementById('ingredientList');
        container.innerHTML = '';
        
        ingredients.forEach((ingredient, index) => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-secondary d-flex align-items-center';
            badge.innerHTML = `
                ${ingredient}
                <button class="btn-close btn-close-white ms-2" data-index="${index}"></button>
            `;
            container.appendChild(badge);
            
            // Add remove functionality
            badge.querySelector('button').addEventListener('click', function() {
                ingredients.splice(index, 1);
                updateIngredientList();
            });
        });
    }
});
