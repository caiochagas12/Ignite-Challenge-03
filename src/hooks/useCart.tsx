import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart');

     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];                                                // Variável que vamos manusear
      const productExists = updatedCart.find(product => product.id === productId);  // Checar se o produto existe :)
      const stock = await api.get(`/stock/${productId}`);                           // Contem os dados de estoque da API
      const stockAmount = stock.data.amount;                                        // Contem os dados de QT
      const currentAmount = productExists ? productExists.amount : 0;               // Checa se existe produto no carrinho
      const amount = currentAmount + 1;                      //QT desejada  // Adiciona QT ao carrinho

      if (amount >stockAmount){               //Se a QT desejada ultrapassar a total do estoque, exibe msg de erro !
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists){                     // Se existe, adiciona QT, se não existe, adiciona Item novo com QT 1
        productExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

      const newProduct = {
        ...product.data,
        amount:1
      }
      updatedCart.push(newProduct);           // Poe na variável declarada acima, updatedCart, o NewProduct
      }

      setCart(updatedCart);                      // E só aqui a gente usa o Set pra dar updade no 'Cart'

      localStorage.setItem('@RocketShoes:cart',JSON.stringify(updatedCart));         //Depois enfia essa porra no localstorage
    } catch {
      toast.error('Erro na adição do produto');
    }
  };  // DONE !

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      if(productIndex >=0){
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };  // DONE !

  const updateProductAmount = async ({ productId, amount, }: UpdateProductAmount) => {

    try {
      if (amount >= 0){
        return;
      }

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      if (amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      if(productExists){
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(updatedCart));

      }else{
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  
  };  // DONE !

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
