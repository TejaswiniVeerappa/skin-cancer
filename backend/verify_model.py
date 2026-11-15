import os
import numpy as np
from PIL import Image
import tensorflow as tf

model = tf.keras.models.load_model('trained_model/model.h5')
for folder in ['../dataset/benign', '../dataset/malignant']:
    files = [os.path.join(folder, f) for f in os.listdir(folder)[:10] if os.path.isfile(os.path.join(folder, f))]
    for path in files:
        img = Image.open(path).convert('RGB').resize((224, 224))
        arr = np.array(img) / 255.0
        arr = np.expand_dims(arr, 0)
        pred = float(model.predict(arr, verbose=0)[0][0])
        print(os.path.basename(path), folder.split('/')[-1], pred)
    print('---')
