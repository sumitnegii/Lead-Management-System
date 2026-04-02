const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://hindaiautomate_db_user:VkJzmC9yYEWQNhDC@clusterautomate.6xzg33g.mongodb.net/leadsDB?retryWrites=true&w=majority")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));