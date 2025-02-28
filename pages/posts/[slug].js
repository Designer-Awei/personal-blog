import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import Layout from '../../components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function Post({ frontmatter, slug, content }) {
    return (
        <Layout>
            <Card className="max-w-4xl mx-auto shadow-md">
                <CardHeader>
                    <CardTitle className="text-3xl">{frontmatter.title}</CardTitle>
                    <p className="text-gray-500 dark:text-gray-400">
                        {new Date(frontmatter.date).toLocaleDateString('zh-CN')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div 
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: marked(content) }}
                    />
                </CardContent>
            </Card>
        </Layout>
    );
}

export async function getStaticPaths() {
    const files = fs.readdirSync(path.join('markdown'));

    const paths = files.map(filename => ({
        params: {
            slug: filename.replace('.md', '')
        }
    }));

    return {
        paths,
        fallback: false
    };
}

export async function getStaticProps({ params: { slug } }) {
    const markdownWithMeta = fs.readFileSync(
        path.join('markdown', `${slug}.md`),
        'utf-8'
    );

    const { data: frontmatter, content } = matter(markdownWithMeta);

    return {
        props: {
            frontmatter,
            slug,
            content
        }
    };
} 