"""Rebuild the offline classifier. Requires Python, numpy and scikit-learn."""
from pathlib import Path
import json
import unicodedata
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
root=Path(__file__).resolve().parent
sentences,labels=[],[]
for line in (root/'corpus.txt').read_text().splitlines():
    if line.startswith('['):
        label=line[1:-1]
    elif line.strip():
        sentences.append(unicodedata.normalize('NFKC',line).lower())
        labels.append(label)
vectorizer=CountVectorizer(analyzer='char',ngram_range=(1,3),lowercase=False,binary=True,min_df=2)
x=vectorizer.fit_transform(sentences)
model=LogisticRegression(C=4.0,max_iter=1000,random_state=13)
model.fit(x,labels)
vocab=vectorizer.get_feature_names_out()
# Learned linear weights rounded to hundredths. Indices follow alphabetical labels.
features={word:[int(v) for v in np.rint(model.coef_[:,i]*100)] for i,word in enumerate(vocab)}
objects={'labels':model.classes_.tolist(),'intercept':np.rint(model.intercept_*100).astype(int).tolist(),'features':features}
source=(root/'runtime.template').read_text()
source=source.replace('/*TRAINED_MODEL*/',json.dumps(objects,ensure_ascii=False,separators=(',',':')))
(root/'cook-model.ts').write_text(source)
print(f'Trained {len(sentences)} observations, {len(vocab)} n-grams, {len(model.classes_)} labels.')
