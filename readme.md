## Database Models Schema

This project have 2 Models written in mongodb

### User
- Name (Required)
- Email (Required)
- Password (Required)
- isAdmin (Optional by Default false)
- resetToken (For Password Reset)
- resetTokenExpire (For Password Reset)

### Meal
- Name (Required)
- Time (Required)
- Calories (Optional as an input automatically populated via Neturenix api or 250 if not found any result in api)
- userId (Required)