# UNFORGETTABLE

## Inspiration  
One of our teammates is notoriously forgetful—he often realizes he’s left his wallet at home only after arriving at the airport. We wanted to create something that helps people like him remember important items before it’s too late.

## What It Does  
**Unforgettable** is a smart web application that helps you remember essential items before leaving home, using location awareness and weather-based suggestions.

After signing in with Google, users can set any U.S. location as their “home,” track their current location, and view the distance between the two. Users can add personalized reminder items—like *wallet*, *keys*, or *headphones*—and set conditions for when reminders should trigger (e.g., “when leaving home”). If you leave without something important, these items will be shown on the home page.

Traveling somewhere new? The app also includes a travel feature that allows users to add global destinations. Based on the location and weather, the app generates a **personalized checklist** to help you pack accordingly—whether it’s rain gear, sunscreen, or winter clothes.

## How We Built It  
The app was developed using **HTML, CSS, and JavaScript**, with backend services powered by **Appwrite** for storing user data and managing authentication. We integrated geolocation APIs to track movement and location-based triggers.

## Challenges We Ran Into  
As we added more features, managing the UI with plain JavaScript became increasingly difficult and buggy. The process of hooking up the backend with our frontend is especially tedious and led to many bugs. We tried to fix most of them but maybe some of them are left unfixed due to limited time. In hindsight, using a framework like React from the beginning would have saved us time and effort—but by the time we realized it, we had already built too much to switch.

## Accomplishments We’re Proud Of  
We’re proud of how practical and versatile this project is. It solves a real-world problem in a simple, intuitive way, and has the potential to grow into something many people would find useful. We’re excited about what it can become beyond the hackathon.

## What We Learned  
We discovered how rewarding (and sometimes frustrating) web development can be. We learned a lot about DOM manipulation, geolocation, user authentication, and how to think through UX from a real user’s perspective.

## What’s Next for Unforgettable  
We plan to keep improving Unforgettable—starting with bug fixes and possibly migrating to a more robust frontend framework (i.e. React). We'd also love to incorporate some AI features in, such as **actually smart** suggestions. Ultimately, we’d love to launch it publicly and help more people leave home *with everything they need.*

## License

MIT
