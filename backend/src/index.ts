import app from './server';
import { env } from './config/env';

const port = env.PORT;

app.listen(port, () => {
  console.log(`Capifit API listening on port ${port}`);
});
