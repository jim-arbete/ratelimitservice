import 'reflect-metadata';
import { ApolloServer } from 'apollo-server';
import { buildSchema } from 'type-graphql';
import { PORT } from './utils/config';

async function bootstrap() {
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
