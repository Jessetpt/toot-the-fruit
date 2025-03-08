from PIL import Image, ImageDraw
import os

# Make sure the images directory exists
os.makedirs("images", exist_ok=True)

# Define colors for each sprite
sprites = {
    "apple.png": (255, 0, 0),      # Red
    "orange.png": (255, 165, 0),   # Orange
    "banana.png": (255, 255, 0),   # Yellow
    "broccoli.png": (0, 255, 0),   # Green
    "eggplant.png": (128, 0, 128), # Purple
    "radish.png": (255, 192, 203)  # Pink
}

# Create each sprite
for filename, color in sprites.items():
    # Create a new 50x50 image with white background
    img = Image.new('RGBA', (50, 50), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a colored circle
    draw.ellipse((5, 5, 45, 45), fill=color)
    
    # Add a black border
    draw.ellipse((5, 5, 45, 45), outline=(0, 0, 0))
    
    # Save the image
    img.save(f"images/{filename}")
    print(f"Created {filename}")

print("All placeholder sprites created successfully!")
