import { config } from './config';
import { app } from './app';

app.listen(config.listenPort, () => {
	console.log(`Server started on port ${config.listenPort}`);
});
