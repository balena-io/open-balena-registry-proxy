import * as config from './config';
import { app } from './app';

app.listen(config.server.port, () => {
	console.log(`Server started on port ${config.server.port}`);
});
