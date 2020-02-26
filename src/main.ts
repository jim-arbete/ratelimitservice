import 'reflect-metadata';
import { ApolloServer } from 'apollo-server';
import { buildSchema } from 'type-graphql';
import { PORT } from './utils/config';

// const process.env.HOST
async function bootstrap() {
  // await redis.set('test', '1337');
  // const redtest = await redis.get('test');
  // console.log('redtest :', redtest);

  // Build TypeGraphQL executable schema
  const schema = await buildSchema({
    resolvers: [__dirname + '/**/*.resolver.{ts,js}'],
  });

  // Create apollo server
  const server = new ApolloServer({
    schema,
    playground: true,
    // tracing: true,
  });

  // Start the server
  const { url } = await server.listen(PORT);
  console.log(`Server is running, GraphQL Playground available at ${url}`);
}

bootstrap();
