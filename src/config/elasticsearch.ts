import dotenv from 'dotenv';

dotenv.config();

interface ElasticsearchConfig {
  node: string;
}

const config: ElasticsearchConfig = {
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
};

export default config;