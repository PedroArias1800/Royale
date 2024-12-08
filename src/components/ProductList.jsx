import React, { useRef } from "react";
import { Card } from "./Card";

export const ProductList = ({ products }) => {
  const cardsRef = useRef([]);
  return (
    <div className="product-list">
      {
        products.Parfum.map((product, index) => {
          const selectedType = product.types.find((type) => type.ml === "100") || product.types[0];
          return (
            <Card element={product} selectedType={selectedType} cardsRef={cardsRef} index={index} key={index} width100={true}/>
          )
        })}
    </div>
  );
};
