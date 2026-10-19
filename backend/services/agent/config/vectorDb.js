import { cosineSimilarity } from "@langchain/core/utils/math";
import { embeddings } from "./embeddings.js";

export const vectorStore = async (docs) => {
    const texts = docs.map((d) => d.pageContent);
    const docVectors = await embeddings.embedDocuments(texts);

    return {
        async similaritySearch(query, k = 5) {
            const queryVector = await embeddings.embedQuery(query);
            const similarities = cosineSimilarity([queryVector], docVectors)[0];

            const scoredDocs = docs.map((doc, i) => ({
                doc,
                score: similarities[i] ?? -1
            }));

            scoredDocs.sort((a, b) => b.score - a.score);

            return scoredDocs.slice(0, k).map((item) => item.doc);
        }
    };
};