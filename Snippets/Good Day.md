```dataviewjs
const currentHour = moment().format('HH');
console.log(currentHour)
let greeting;
if (currentHour >= 18 || currentHour < 5) {
 	greeting = '🌙 Good Evening'
} else if (currentHour >= 5 && currentHour < 12) {
	 greeting = '☀️ Good Morning'
} else {
	greeting = '☀️ Good Afternoon'
}

dv.header(2, greeting)
```