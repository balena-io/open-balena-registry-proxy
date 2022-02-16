import { PORT } from './config';
import { app } from './app';

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});
