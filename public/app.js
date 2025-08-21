document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let currentPage = 1;
    let limit = 15;
    let totalRecipes = 0;
    let currentFilters = {};

    // --- DOM ELEMENT SELECTORS ---
    const app = document.getElementById('app');
    const titleFilter = document.getElementById('title-filter');
    const cuisineFilter = document.getElementById('cuisine-filter');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const resultsPerPageSelect = document.getElementById('results-per-page');
    const drawer = document.getElementById('recipe-drawer');
    const overlay = document.getElementById('overlay');
    const drawerCloseBtn = document.getElementById('drawer-close');

    // --- API & DATA FETCHING ---
    const fetchRecipes = async () => {
        let url;
        const filters = { ...currentFilters };
        
        // Decide which endpoint to use
        if (Object.values(filters).some(val => val)) {
            const queryParams = new URLSearchParams(filters).toString();
            url = `/api/recipes/search?${queryParams}`;
        } else {
            url = `/api/recipes?page=${currentPage}&limit=${limit}`;
        }
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            
            // The /search endpoint doesn't paginate, so we handle both response types
            if (result.total !== undefined) {
                totalRecipes = result.total;
                renderTable(result.data);
            } else {
                totalRecipes = result.data.length;
                renderTable(result.data);
            }
            updatePagination();
        } catch (error) {
            console.error('Fetch error:', error);
            app.innerHTML = `<div class="fallback">Could not load recipes. Please make sure the server is running.</div>`;
        }
    };

    // --- RENDERING ---
    const renderTable = (recipes) => {
        if (!recipes || recipes.length === 0) {
            app.innerHTML = `<div class="fallback">No recipes found. Try adjusting your filters.</div>`;
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Cuisine</th>
                    <th>Rating</th>
                    <th>Total Time (mins)</th>
                    <th>Serves</th>
                </tr>
            </thead>
            <tbody>
                ${recipes.map(recipe => `
                    <tr data-recipe-id="${recipe.id}">
                        <td class="truncate">${recipe.title || 'N/A'}</td>
                        <td>${recipe.cuisine || 'N/A'}</td>
                        <td>${generateStars(recipe.rating)}</td>
                        <td>${recipe.total_time || 'N/A'}</td>
                        <td>${recipe.serves || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        app.innerHTML = '';
        app.appendChild(table);

        // Add click listeners to each new row
        table.querySelectorAll('tbody tr').forEach(row => {
            row.addEventListener('click', () => handleRowClick(row.dataset.recipeId, recipes));
        });
    };
    
    const generateStars = (rating) => {
        if (!rating) return '<span class="star-rating">N/A</span>';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        return `
            <span class="star-rating">
                ${'★'.repeat(fullStars)}
                ${'½'.repeat(halfStar)}
                ${'☆'.repeat(emptyStars)}
            </span>
        `;
    };

    const updatePagination = () => {
        const totalPages = Math.ceil(totalRecipes / limit);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    };

    // --- EVENT HANDLERS ---
    const handleFilter = () => {
        currentFilters = {
            title: titleFilter.value,
            cuisine: cuisineFilter.value,
        };
        currentPage = 1; // Reset to first page on new filter
        fetchRecipes();
    };

    const changePage = (direction) => {
        currentPage += direction;
        fetchRecipes();
    };
    
    const handleRowClick = (recipeId, recipes) => {
        const recipe = recipes.find(r => r.id == recipeId);
        if (recipe) {
            openDrawer(recipe);
        }
    };
    
    // --- DRAWER LOGIC ---
    const openDrawer = (recipe) => {
        // Populate Header
        document.getElementById('drawer-title').textContent = recipe.title;
        document.getElementById('drawer-cuisine').textContent = recipe.cuisine;
        
        // Populate Content
        document.getElementById('drawer-description').textContent = recipe.description;
        document.getElementById('drawer-total-time').textContent = `${recipe.total_time || 'N/A'} mins`;
        document.getElementById('drawer-prep-time').textContent = `${recipe.prep_time || 'N/A'} mins`;
        document.getElementById('drawer-cook-time').textContent = `${recipe.cook_time || 'N/A'} mins`;

        // Populate Nutrition Table
        const nutritionTable = document.getElementById('nutrition-table');
        const nutrients = recipe.nutrients || {};
        const nutrientKeys = ['calories', 'carbohydrateContent', 'cholesterolContent', 'fiberContent', 'proteinContent', 'saturatedFatContent', 'sodiumContent', 'sugarContent', 'fatContent'];
        nutritionTable.innerHTML = nutrientKeys.map(key => `
            <tr>
                <td class="key">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
                <td>${nutrients[key] || 'N/A'}</td>
            </tr>
        `).join('');

        // Show drawer and overlay
        drawer.classList.add('open');
        overlay.classList.add('open');
    };

    const closeDrawer = () => {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        // Reset time expander
        document.getElementById('sub-time-details').style.display = 'none';
        document.getElementById('expand-time').classList.remove('expanded');
    };

    // --- INITIALIZATION ---
    titleFilter.addEventListener('input', handleFilter);
    cuisineFilter.addEventListener('input', handleFilter);
    prevPageBtn.addEventListener('click', () => changePage(-1));
    nextPageBtn.addEventListener('click', () => changePage(1));
    resultsPerPageSelect.addEventListener('change', (e) => {
        limit = parseInt(e.target.value);
        currentPage = 1;
        fetchRecipes();
    });
    drawerCloseBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    // Time expander logic
    document.getElementById('expand-time').addEventListener('click', (e) => {
        const subDetails = document.getElementById('sub-time-details');
        e.target.classList.toggle('expanded');
        subDetails.style.display = subDetails.style.display === 'block' ? 'none' : 'block';
    });
    
    // Initial fetch
    fetchRecipes();
});