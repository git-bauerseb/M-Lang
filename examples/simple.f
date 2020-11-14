str = "The quick brown fox jumps over the lazy dog";
s = length(str);
cube = lambda(x) x*x*x;


# Writes the cube of the length of the string str
# to a file called 'result.out' in the current directory
write("./result.out", cube(s));