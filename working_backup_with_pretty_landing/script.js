// Initialize Supabase client
const supabaseUrl = 'https://ryuauofwsmxrshukkfxf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dWF1b2Z3c214cnNodWtrZnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDQyMDIsImV4cCI6MjA1NjkyMDIwMn0.Ip-_52luAAL2NITSOyVcoW5E04V7SVEdQzr4vWMzPyM';
const { createClient } = supabase;
const supabase = createClient(supabaseUrl, supabaseKey);

// Handle form submission
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission
    const email = document.getElementById('emailInput').value; // Get the email input value

    // Insert email into Supabase
    const { data, error } = await supabase
        .from('emails')
        .insert([{ email }]);
    
    if (error) {
        console.error('Error inserting email:', error);
        alert('Failed to submit email. Please try again.');
    } else {
        alert('Email submitted successfully!');
        // Redirect to the game
        window.location.href = 'index.html';
    }
});
