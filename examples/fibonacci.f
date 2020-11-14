fibonacci = lambda(n) 
                if n <= 2 
                then n 
                else fibonacci(n-1) + fibonacci(n-2);

print(fibonacci(27));